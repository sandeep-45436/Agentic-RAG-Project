import { z } from 'zod';
import { DocumentDeliveryResult, DocumentDeliveryRequest, DocumentOperation } from '@/ai/documents/document-delivery.types';
import { DocumentAccessControl } from '@/ai/documents/document-access-control';
import { PdfExtractionService } from '@/server/services/pdf-extraction.service';
import { PageRangeResolver } from '@/ai/knowledge/page-range-resolver';
import { RetrievalService } from '@/server/services/retrieval.service';
import { db } from '@/server/db/prisma';
import { Role } from '@/ai/tools/tool-registry';

export const DocumentDeliverySchema = z.object({
  operation: z.enum([
    "GET_FULL_DOCUMENT",
    "GET_PAGES",
    "GET_SECTION",
    "SEARCH_AND_EXTRACT"
  ]),
  documentId: z.string().optional(),
  courseCode: z.string().optional(),
  pages: z.array(z.number()).optional(),
  section: z.string().optional(),
  query: z.string().optional(),
  organizationId: z.string(),
  userId: z.string(),
  userRole: z.string().default("MEMBER"),
  departmentId: z.string().optional().nullable(),
  collegeId: z.string().optional().nullable(),
});

export type DocumentDeliveryInput = z.infer<typeof DocumentDeliverySchema>;

export class DocumentDeliveryTool {
  static readonly toolName = "document_delivery";
  static readonly description = "Retrieve, extract, or generate PDF course documents. Supports full document retrieval, specific page extraction, section extraction, and semantic search-based extraction.";
  static readonly schema = DocumentDeliverySchema;

  static async execute(input: DocumentDeliveryInput): Promise<{ success: boolean; result?: DocumentDeliveryResult; error?: string }> {
    try {
      const validatedInput = DocumentDeliverySchema.parse(input);
      let targetDocumentId = validatedInput.documentId;
      let targetDocumentName = "";

      if (!targetDocumentId) {
        // 1. Try courseCode match if provided
        if (validatedInput.courseCode) {
          const doc = await db.document.findFirst({
            where: {
              organizationId: validatedInput.organizationId,
              deletedAt: null,
              OR: [
                { fileName: { contains: validatedInput.courseCode, mode: 'insensitive' } },
                { knowledgeBase: { name: { contains: validatedInput.courseCode, mode: 'insensitive' } } }
              ]
            }
          });
          if (doc) {
            targetDocumentId = doc.id;
            targetDocumentName = doc.fileName;
          }
        }

        // 2. Keyword matching in query (e.g. "CNIP", "syllabus", "handbook")
        if (!targetDocumentId && (validatedInput.query || validatedInput.section)) {
          const rawText = (validatedInput.query || validatedInput.section || "");
          const words = rawText.split(/\s+/).map(w => w.replace(/[^a-zA-Z0-9]/g, "")).filter(w => w.length >= 3 && !['give', 'that', 'this', 'from', 'with', 'pages', 'extract', 'file', 'document', 'pdf', 'ppt'].includes(w.toLowerCase()));

          if (words.length > 0) {
            const keywordDoc = await db.document.findFirst({
              where: {
                organizationId: validatedInput.organizationId,
                deletedAt: null,
                OR: words.map(word => ({
                  fileName: { contains: word, mode: 'insensitive' }
                }))
              }
            });
            if (keywordDoc) {
              targetDocumentId = keywordDoc.id;
              targetDocumentName = keywordDoc.fileName;
            }
          }
        }

        // 3. Semantic search fallback using query or section with access context
        if (!targetDocumentId && (validatedInput.query || validatedInput.section)) {
          const searchQuery = validatedInput.query || validatedInput.section || "university document";
          const retrievalResult = await RetrievalService.buildContextualPrompt(
            searchQuery,
            validatedInput.organizationId,
            [],
            undefined,
            {
              organizationId: validatedInput.organizationId,
              userId: validatedInput.userId,
              userRole: validatedInput.userRole as any,
              departmentId: validatedInput.departmentId,
              collegeId: validatedInput.collegeId,
            }
          );
          if (retrievalResult.chunks.length > 0) {
            for (const chunk of retrievalResult.chunks) {
              if (chunk.documentId) {
                const liveDoc = await db.document.findFirst({
                  where: {
                    id: chunk.documentId,
                    organizationId: validatedInput.organizationId,
                    deletedAt: null,
                  },
                });
                if (liveDoc) {
                  targetDocumentId = liveDoc.id;
                  targetDocumentName = liveDoc.fileName;
                  break;
                }
              }
            }
          }
        }

        // 4. Department / Organization fallback: select most recent accessible document
        if (!targetDocumentId) {
          const docWhere: any = {
            organizationId: validatedInput.organizationId,
            deletedAt: null,
          };

          if (validatedInput.departmentId && validatedInput.departmentId !== "ALL") {
            docWhere.OR = [
              { departmentId: validatedInput.departmentId },
              { visibility: "UNIVERSITY" },
              { visibility: "DEPARTMENT", departmentId: null },
            ];
          }

          const doc = await db.document.findFirst({
            where: docWhere,
            orderBy: { createdAt: 'desc' },
          });
          if (doc) {
            targetDocumentId = doc.id;
            targetDocumentName = doc.fileName;
          }
        }

        // 5. Multi-organization / Global university document fallback
        if (!targetDocumentId) {
          const userMems = await db.membership.findMany({
            where: { userId: validatedInput.userId },
            select: { organizationId: true }
          });
          const allOrgIds = [...new Set([...userMems.map(m => m.organizationId), "seed-org-001"])];
          
          const multiOrgDoc = await db.document.findFirst({
            where: {
              organizationId: { in: allOrgIds },
              deletedAt: null,
            },
            orderBy: { createdAt: 'desc' }
          });

          if (multiOrgDoc) {
            targetDocumentId = multiOrgDoc.id;
            targetDocumentName = multiOrgDoc.fileName;
            validatedInput.organizationId = multiOrgDoc.organizationId;
          }
        }

        if (!targetDocumentId) {
          return { success: false, error: "No document available in organization for extraction." };
        }
      }

      const access = await DocumentAccessControl.checkAccess({
        userId: validatedInput.userId,
        userRole: validatedInput.userRole as Role,
        organizationId: validatedInput.organizationId,
        documentId: targetDocumentId,
        departmentId: validatedInput.departmentId,
        collegeId: validatedInput.collegeId,
      });

      if (!access.allowed) {
        return { success: false, error: access.reason || "Access denied to document." };
      }

      const accessLevel = access.accessLevel || "RESTRICTED";

      switch (validatedInput.operation) {
        case "GET_FULL_DOCUMENT": {
          const data = await PdfExtractionService.getFullDocument(targetDocumentId, validatedInput.organizationId);
          if (!data) {
            return { success: false, error: "Failed to retrieve full document." };
          }
          
          const pages = Array.from({ length: data.totalPages }, (_, i) => i + 1);
          
          const result: DocumentDeliveryResult = {
            artifactId: data.artifactId,
            operation: "GET_FULL_DOCUMENT",
            documentId: targetDocumentId,
            documentName: data.documentName,
            pages: pages,
            totalPages: data.totalPages,
            downloadUrl: data.downloadUrl,
            signedUrlExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            confidence: 1.0,
            provenance: {
              artifactId: data.artifactId,
              sourceDocumentId: targetDocumentId,
              sourceDocumentName: data.documentName,
              documentVersion: 1,
              docHash: "",
              originalPages: pages,
              chunkIds: [],
              organizationId: validatedInput.organizationId,
              generatedAt: new Date().toISOString(),
              accessLevel: accessLevel
            }
          };
          return { success: true, result };
        }
        case "GET_PAGES": {
          if (!validatedInput.pages || validatedInput.pages.length === 0) {
            return { success: false, error: "Pages array must be provided and non-empty for GET_PAGES operation." };
          }
          const data = await PdfExtractionService.createExtract({
            documentId: targetDocumentId,
            organizationId: validatedInput.organizationId,
            pages: validatedInput.pages
          });
          if (!data) {
            return { success: false, error: "Failed to extract pages." };
          }
          const result: DocumentDeliveryResult = {
            artifactId: data.artifactId,
            operation: "GET_PAGES",
            documentId: targetDocumentId,
            documentName: data.documentName,
            pages: validatedInput.pages,
            totalPages: data.totalPages,
            downloadUrl: data.downloadUrl,
            signedUrlExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            confidence: 1.0,
            provenance: data.provenance
          };
          return { success: true, result };
        }
        case "GET_SECTION": {
          if (!validatedInput.section) {
            return { success: false, error: "Section must be provided for GET_SECTION operation." };
          }

          const retrievalResult = await RetrievalService.buildContextualPrompt(validatedInput.section, validatedInput.organizationId);
          const documentChunks = retrievalResult.chunks.filter(c => c.documentId === targetDocumentId);

          if (documentChunks.length === 0) {
            return { success: false, error: `Section '${validatedInput.section}' not found in the document.` };
          }

          const pageRangeResult = PageRangeResolver.resolvePages({
            documentId: targetDocumentId,
            matchedChunks: documentChunks,
            query: validatedInput.section
          });

          if (!pageRangeResult.pages || pageRangeResult.pages.length === 0) {
            return { success: false, error: "Could not resolve pages for the requested section." };
          }

          const data = await PdfExtractionService.createExtract({
            documentId: targetDocumentId,
            organizationId: validatedInput.organizationId,
            pages: pageRangeResult.pages,
            query: validatedInput.section,
            chunkIds: documentChunks.map(c => c.chunkId).filter(Boolean) as string[]
          });

          if (!data) {
            return { success: false, error: "Failed to extract section pages." };
          }

          const result: DocumentDeliveryResult = {
            artifactId: data.artifactId,
            operation: "GET_SECTION",
            documentId: targetDocumentId,
            documentName: data.documentName,
            pages: pageRangeResult.pages,
            totalPages: data.totalPages,
            downloadUrl: data.downloadUrl,
            signedUrlExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            confidence: pageRangeResult.confidence,
            provenance: data.provenance
          };
          return { success: true, result };
        }
        case "SEARCH_AND_EXTRACT": {
          if (!validatedInput.query) {
            return { success: false, error: "Query must be provided for SEARCH_AND_EXTRACT operation." };
          }

          const retrievalResult = await RetrievalService.buildContextualPrompt(validatedInput.query, validatedInput.organizationId);
          const documentChunks = retrievalResult.chunks.filter(c => c.documentId === targetDocumentId);

          if (documentChunks.length === 0) {
            return { success: false, error: `No relevant content found for query '${validatedInput.query}' in the document.` };
          }

          const pageRangeResult = PageRangeResolver.resolvePages({
            documentId: targetDocumentId,
            matchedChunks: documentChunks,
            query: validatedInput.query
          });

          if (!pageRangeResult.pages || pageRangeResult.pages.length === 0) {
            return { success: false, error: "Could not resolve pages for the search query." };
          }

          const data = await PdfExtractionService.createExtract({
            documentId: targetDocumentId,
            organizationId: validatedInput.organizationId,
            pages: pageRangeResult.pages,
            query: validatedInput.query,
            chunkIds: documentChunks.map(c => c.chunkId).filter(Boolean) as string[]
          });

          if (!data) {
            return { success: false, error: "Failed to extract pages for search." };
          }

          const result: DocumentDeliveryResult = {
            artifactId: data.artifactId,
            operation: "SEARCH_AND_EXTRACT",
            documentId: targetDocumentId,
            documentName: data.documentName,
            pages: pageRangeResult.pages,
            totalPages: data.totalPages,
            downloadUrl: data.downloadUrl,
            signedUrlExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            confidence: pageRangeResult.confidence,
            provenance: data.provenance
          };
          return { success: true, result };
        }
        default:
          return { success: false, error: "Unsupported operation." };
      }
    } catch (e: any) {
      return { success: false, error: e?.message || "An unexpected error occurred." };
    }
  }
}
