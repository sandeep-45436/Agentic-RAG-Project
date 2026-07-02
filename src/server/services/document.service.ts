import { db } from "@/server/db/prisma";
import { createClient } from "@/utils/supabase/server";
import { extractTextFromPdf, chunkText } from "@/ai/loaders/pdf-loader";
import { ensureCollectionExists } from "@/ai/vector/qdrant";
import { EmbeddingService } from "./embedding.service";
import { VectorService, VectorPayload } from "./vector.service";
import { GraphExtractionService } from "./graph-extraction.service";
import { v4 as uuidv4 } from "uuid";
import tiktoken from "tiktoken";
import { AuditService } from "./audit";

export class DocumentService {
  /**
   * Main entry point to upload a document to Supabase (Synchronous).
   * It creates a DB record with PROCESSING status and returns early.
   */
  static async uploadDocument(file: File, organizationId: string, uploadedBy: string, knowledgeBaseId?: string) {
    const supabase = await createClient();
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const storagePath = `${organizationId}/${fileName}`;

    // Auto-create the 'documents' bucket if it doesn't exist yet.
    // Uses the service role key (admin) if available, otherwise falls through.
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient: createAdminClient } = await import("@supabase/supabase-js");
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
      );
      const { error: bucketError } = await admin.storage.createBucket("documents", {
        public: false,
        allowedMimeTypes: ["application/pdf"],
        fileSizeLimit: 10 * 1024 * 1024,
      });
      // Ignore "already exists" — this is idempotent
      if (bucketError && !bucketError.message.toLowerCase().includes("already exist")) {
        console.warn("[DocumentService] Could not auto-create bucket:", bucketError.message);
      }
    }

    // 1. Upload to Supabase Storage (bucket: 'documents')
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file);

    if (uploadError) {
      throw new Error(`Failed to upload to Supabase: ${uploadError.message}`);
    }

    // 2. Create Document record in Prisma
    const document = await db.document.create({
      data: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storagePath: storagePath,
        organizationId,
        knowledgeBaseId, // Optional KB relation
        uploadedBy,
        processingStatus: "PROCESSING",
      },
    });

    // Log the upload event
    await AuditService.logEvent({
      orgId: organizationId,
      userId: uploadedBy,
      action: "DOCUMENT_UPLOAD",
      metadata: {
        documentId: document.id,
        fileName: document.fileName,
        fileSize: document.fileSize,
        knowledgeBaseId,
      },
    });
    
    return document;
  }

  /**
   * Background process for text extraction, chunking, and embedding.
   */
  static async processDocumentAsync(documentId: string, fileBuffer: ArrayBuffer, organizationId: string, knowledgeBaseId?: string, fileName?: string) {
    const log = (msg: string) => console.log(`[DocProcess:${documentId.slice(0,8)}] ${msg}`);
    try {
      log(`Starting processing for: ${fileName}`);
      const buffer = Buffer.from(fileBuffer);

      // Step 1: Extract text
      log("Step 1: Extracting text from PDF...");
      const text = await extractTextFromPdf(buffer);
      log(`Step 1 done. Text length: ${text.length} chars`);

      if (!text || text.trim().length === 0) {
        throw new Error("PDF appears to be empty or contains no extractable text.");
      }

      await db.document.update({
        where: { id: documentId },
        data: { content: text },
      });

      // Step 2: Chunk text
      log("Step 2: Chunking text...");
      const chunks = await chunkText(text);
      log(`Step 2 done. Chunks: ${chunks.length}`);
      if (chunks.length === 0) {
        throw new Error("No chunks produced from text.");
      }

      // Step 3: Ensure Qdrant collection
      log("Step 3: Ensuring Qdrant collection...");
      await ensureCollectionExists();
      log("Step 3 done.");

      // Step 4: Embed + store
      const BATCH_SIZE = 50;
      const encoder = tiktoken.encoding_for_model("text-embedding-3-small");

      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batchTexts = chunks.slice(i, i + BATCH_SIZE);
        log(`Step 4: Embedding batch ${i / BATCH_SIZE + 1} (${batchTexts.length} chunks)...`);

        const vectors = await EmbeddingService.embedBatch(batchTexts, 3);

        if (vectors.length !== batchTexts.length) {
          throw new Error("Mismatch between batch size and generated vectors.");
        }

        const qdrantPoints = [];

        for (let j = 0; j < batchTexts.length; j++) {
          const chunkText = batchTexts[j];
          const globalIndex = i + j;
          const tokenCount = encoder.encode(chunkText).length;

          const chunkRecord = await db.chunk.create({
            data: {
              content: chunkText,
              chunkIndex: globalIndex,
              tokenCount,
              documentId,
              organizationId,
            },
          });

          const payload: VectorPayload = {
            organizationId,
            documentId,
            documentName: fileName || "Unknown",
            chunkId: chunkRecord.id,
            chunkIndex: globalIndex,
            chunkText,
            ...(knowledgeBaseId && { knowledgeBaseId }),
          };

          qdrantPoints.push({ id: chunkRecord.id, vector: vectors[j], payload });
        }

        await VectorService.upsertBatch(qdrantPoints);
        log(`Batch ${i / BATCH_SIZE + 1} upserted to Qdrant.`);
      }

      encoder.free();

      // Step 5: Graph extraction (non-blocking)
      log("Step 5: Triggering graph extraction (non-blocking)...");
      GraphExtractionService.extractAndIngest(text, organizationId, documentId).catch((err) => {
        log(`Graph extraction failed (non-fatal): ${err?.message ?? err}`);
      });

      // Mark completed
      await db.document.update({
        where: { id: documentId },
        data: { processingStatus: "COMPLETED" },
      });
      log("✅ Processing COMPLETED");

      // Log success event
      const doc = await db.document.findUnique({ where: { id: documentId } });
      await AuditService.logEvent({
        orgId: organizationId,
        userId: doc?.uploadedBy,
        action: "DOCUMENT_PROCESSING_COMPLETED",
        metadata: {
          documentId,
          fileName: fileName || doc?.fileName,
          chunksCount: chunks.length,
        },
      });

    } catch (error: any) {
      console.error(`[DocProcess:${documentId.slice(0,8)}] ❌ FAILED:`, error?.message ?? error);
      await db.document.update({
        where: { id: documentId },
        data: { processingStatus: "FAILED" },
      });

      // Log failure event
      const doc = await db.document.findUnique({ where: { id: documentId } });
      await AuditService.logEvent({
        orgId: organizationId,
        userId: doc?.uploadedBy,
        action: "DOCUMENT_PROCESSING_FAILED",
        metadata: {
          documentId,
          fileName: fileName || doc?.fileName,
          error: error?.message || String(error),
        },
      });

      throw error;
    }
  }
}
