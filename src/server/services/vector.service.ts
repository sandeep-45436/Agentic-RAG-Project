import { qdrant, GLOBAL_COLLECTION_NAME } from "@/ai/vector/qdrant";

export type VectorPayload = {
  organizationId: string;
  knowledgeBaseId?: string;
  documentId: string;
  documentName: string;
  chunkId: string;
  chunkIndex: number;
  chunkText: string;
  pageNumber?: number | null;
  tags?: string[];
  metadata?: Record<string, any>;
};

export interface ScoredVectorResult {
  payload: VectorPayload;
  score: number;
}

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
   * Returns results with similarity scores for use in hybrid fusion.
   */
  static async similaritySearch(
    vector: number[],
    organizationId: string,
    limit: number = 20,
    documentIds?: string[]
  ): Promise<ScoredVectorResult[]> {
    try {
      const mustFilters: any[] = [
        {
          key: "organizationId",
          match: {
            value: organizationId,
          },
        },
      ];

      // Inject document filter if specified for retrieval memory boosting
      if (documentIds && documentIds.length > 0) {
        mustFilters.push({
          key: "documentId",
          match: {
            any: documentIds,
          },
        });
      }

      const results = await qdrant.search(GLOBAL_COLLECTION_NAME, {
        vector,
        limit,
        with_payload: true,
        filter: {
          must: mustFilters,
        },
      });

      return results.map((hit) => ({
        payload: hit.payload as unknown as VectorPayload,
        score: hit.score,
      }));
    } catch (error) {
      console.error("[VectorService] Similarity search failed:", error);
      throw error;
    }
  }
}

