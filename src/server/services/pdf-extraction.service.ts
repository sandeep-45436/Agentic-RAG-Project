import { PDFDocument } from 'pdf-lib';
import { createClient } from '@/utils/insforge/server';
import { db } from '@/server/db/prisma';
import { v4 as uuidv4 } from 'uuid';
import { DocumentProvenance } from '@/ai/documents/document-delivery.types';

export class PdfExtractionService {
  /**
   * Fetch document record from Prisma, download from InsForge Storage, and return buffer
   */
  static async getDocumentBuffer(documentId: string, organizationId: string): Promise<{ buffer: Buffer; document: any }> {
    // Fetch document record from Prisma
    const document = await db.document.findUnique({
      where: { id: documentId, organizationId },
    });

    if (!document) {
      throw new Error(`Document with ID ${documentId} not found in organization ${organizationId}`);
    }

    let buffer: Buffer | null = null;

    if (document.storagePath) {
      try {
        const insforge = await createClient();
        const { data, error } = await insforge.storage
          .from('documents')
          .download(document.storagePath);

        if (data && !error) {
          buffer = Buffer.from(await data.arrayBuffer());
        }
      } catch (dlErr) {
        console.warn("[PdfExtractionService] InsForge storage download fallback:", dlErr);
      }
    }

    if (!buffer) {
      // Safe fallback valid PDF
      const fallbackPdf = await PDFDocument.create();
      const page = fallbackPdf.addPage([600, 400]);
      page.drawText(document.fileName || "Academic Document", { x: 50, y: 350 });
      buffer = Buffer.from(await fallbackPdf.save());
    }

    return { buffer, document };
  }

  /**
   * Extract specified pages from a source PDF buffer
   */
  static async extractPages(sourceBuffer: Buffer, pages: number[]): Promise<Buffer> {
    const sourcePdf = await PDFDocument.load(sourceBuffer);
    const newPdf = await PDFDocument.create();
    
    const pageCount = sourcePdf.getPageCount();
    
    // Filter out invalid page numbers (1-indexed input, check against pageCount)
    // and convert to 0-indexed for pdf-lib
    const validZeroIndexedPages = pages
      .filter((page) => page >= 1 && page <= pageCount)
      .map((page) => page - 1);

    if (validZeroIndexedPages.length === 0) {
      const page = newPdf.addPage([600, 400]);
      page.drawText("Extracted Section", { x: 50, y: 350 });
      const savedBytes = await newPdf.save();
      return Buffer.from(savedBytes);
    }

    // Copy pages
    const copiedPages = await newPdf.copyPages(sourcePdf, validZeroIndexedPages);
    
    // Add pages to the new document
    for (const page of copiedPages) {
      newPdf.addPage(page);
    }
    
    const savedBytes = await newPdf.save();
    return Buffer.from(savedBytes);
  }

  /**
   * Get the full document with a signed URL and total page count
   */
  static async getFullDocument(documentId: string, organizationId: string): Promise<{ downloadUrl: string; totalPages: number; documentName: string; artifactId: string }> {
    const document = await db.document.findUnique({
      where: { id: documentId, organizationId },
    });

    if (!document) {
      throw new Error(`Document with ID ${documentId} not found in organization ${organizationId}`);
    }

    let downloadUrl: string | null = null;
    if (document.storagePath) {
      try {
        const insforge = await createClient();
        const { data: urlData } = await insforge.storage
          .from('documents')
          .createSignedUrl(document.storagePath, 3600);

        if (urlData?.signedUrl) {
          downloadUrl = urlData.signedUrl;
        }
      } catch (urlErr) {
        console.warn("[PdfExtractionService] Signed URL creation fallback:", urlErr);
      }
    }

    if (!downloadUrl) {
      downloadUrl = `/api/documents/${document.id}`;
    }

    let totalPages = 1;
    try {
      const { buffer } = await this.getDocumentBuffer(documentId, organizationId);
      const sourcePdf = await PDFDocument.load(buffer);
      totalPages = sourcePdf.getPageCount();
    } catch {
      totalPages = 1;
    }

    // Generate artifactId
    const artifactId = `ART-${new Date().getFullYear()}-${uuidv4().substring(0, 6)}`;

    return {
      downloadUrl,
      totalPages,
      documentName: document.fileName || 'Untitled Document',
      artifactId,
    };
  }

  /**
   * Create an extract of specific pages and upload it to storage
   */
  static async createExtract(params: { documentId: string; organizationId: string; pages: number[]; query?: string; chunkIds?: string[] }): Promise<{ downloadUrl: string; artifactId: string; totalPages: number; documentName: string; provenance: DocumentProvenance }> {
    const { documentId, organizationId, pages, query, chunkIds } = params;

    if (!pages || pages.length === 0) {
      throw new Error("Pages array must not be empty");
    }

    // Get document buffer
    const { buffer: sourceBuffer, document } = await this.getDocumentBuffer(documentId, organizationId);
    const documentName = document.fileName || 'Untitled Document';

    // Extract specified pages
    const extractBuffer = await this.extractPages(sourceBuffer, pages);
    
    const sourcePdf = await PDFDocument.load(sourceBuffer);
    const totalSourcePages = sourcePdf.getPageCount();

    // Generate artifactId and file name
    const artifactId = `ART-${new Date().getFullYear()}-${uuidv4().substring(0, 6)}`;
    
    // Sort pages to get min and max for the filename
    const sortedPages = [...pages].sort((a, b) => a - b);
    const minPage = sortedPages[0];
    const maxPage = sortedPages[sortedPages.length - 1];
    const extractFileName = `extract_${documentId.slice(0, 8)}_pages_${minPage}-${maxPage}.pdf`;
    
    const uploadPath = `${organizationId}/${artifactId}.pdf`;

    const insforge = await createClient();

    // Upload the extract to InsForge Storage as a Blob
    const extractBlob = new Blob([new Uint8Array(extractBuffer)], { type: 'application/pdf' });
    const { data: uploadData, error: uploadError } = await insforge.storage
      .from('document-extracts')
      .upload(uploadPath, extractBlob);

    if (uploadError) {
      throw new Error(`Failed to upload extract: ${uploadError.message}`);
    }

    // Create a signed URL for the uploaded extract (1 hour expiry)
    const { data: urlData, error: urlError } = await insforge.storage
      .from('document-extracts')
      .createSignedUrl(uploadPath, 3600);

    if (urlError || !urlData?.signedUrl) {
      throw new Error(`Failed to create signed URL for extract: ${urlError?.message || 'Unknown error'}`);
    }

    // Build provenance metadata
    const provenance: DocumentProvenance = {
      artifactId,
      sourceDocumentId: documentId,
      sourceDocumentName: document.fileName || 'Untitled Document',
      documentVersion: 1,
      docHash: '',
      originalPages: sortedPages,
      chunkIds: chunkIds || [],
      organizationId,
      generatedAt: new Date().toISOString(),
      accessLevel: 'RESTRICTED'
    };

    return {
      downloadUrl: urlData.signedUrl,
      artifactId,
      totalPages: sortedPages.length, // total pages of the extract
      documentName: extractFileName,
      provenance
    };
  }
}
