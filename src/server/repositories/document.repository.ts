import { BaseRepository } from "./base.repository";
import { Prisma } from "@prisma/client";

export class DocumentRepository extends BaseRepository {
  /**
   * Retrieves all non-deleted documents for a specific organization
   */
  async findMany(organizationId: string) {
    return this.db.document.findMany({
      where: this.getBaseWhere(organizationId),
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Retrieves a specific document ensuring it belongs to the organization
   */
  async findById(id: string, organizationId: string) {
    return this.db.document.findFirst({
      where: {
        id,
        ...this.getBaseWhere(organizationId),
      },
      include: {
        chunks: {
          where: { deletedAt: null },
        }
      }
    });
  }

  /**
   * Example of a transactional operation: creating a document and its chunks
   */
  async createWithChunks(organizationId: string, knowledgeBaseId: string, data: { fileName: string; storagePath: string; fileSize: number; fileType: string; uploadedBy: string; content?: string }, chunks: { content: string, chunkIndex: number, tokenCount: number }[]) {
    return this.db.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          organizationId,
          knowledgeBaseId,
          fileName: data.fileName,
          storagePath: data.storagePath,
          fileSize: data.fileSize,
          fileType: data.fileType,
          uploadedBy: data.uploadedBy,
          content: data.content,
        },
      });

      if (chunks.length > 0) {
        await tx.chunk.createMany({
          data: chunks.map(chunk => ({
            ...chunk,
            documentId: doc.id,
            organizationId,
          })),
        });
      }

      return doc;
    });
  }

  /**
   * Soft deletes a document
   */
  async softDelete(id: string, organizationId: string) {
    return this.db.document.updateMany({
      where: {
        id,
        ...this.getBaseWhere(organizationId), // Ensure we only delete our own document
      },
      data: this.getSoftDeletePayload(),
    });
  }
}
