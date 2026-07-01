import { qdrant, GLOBAL_COLLECTION_NAME } from "@/ai/vector/qdrant";

export type VectorPayload = {
  organizationId: string;
  knowledgeBaseId?: string;
  documentId: string;
  documentName: string;
  chunkId: string;
  chunkIndex: number;
  chunkText: string;
  tags?: string[];
  metadata?: Record<string, any>;
};

export class VectorService {
  /**
   * Upserts a batch of vectors and payloads to Qdrant.
   */
  static async upsertBatch(points: { id: string; vector: number[]; payload: VectorPayload }[]) {
    if (points.length === 0) return;

    try {
      await qdrant.upsert(GLOBAL_COLLECTION_NAME, {
        wait: true,
        points: points.map(p => ({
          id: p.id,
          vector: p.vector,
          payload: p.payload as Record<string, unknown>
        })),
      });
    } catch (error) {
      console.error("[VectorService] Failed to upsert batch to Qdrant:", error);
      throw error;
    }
  }

  /**
   * Searches Qdrant using semantic similarity, enforcing strict organization isolation.
   */
  static async similaritySearch(vector: number[], organizationId: string, limit: number = 20) {
    try {
      const results = await qdrant.search(GLOBAL_COLLECTION_NAME, {
        vector,
        limit,
        filter: {
          must: [
            {
              key: "organizationId",
              match: {
                value: organizationId,
              },
            },
          ],
        },
      });

      return results;
    } catch (error) {
      console.error("[VectorService] Similarity search failed:", error);
      throw error;
    }
  }
}
