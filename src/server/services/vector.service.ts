import { qdrant, GLOBAL_COLLECTION_NAME } from "@/ai/vector/qdrant";

export type VectorPayload = {
  organizationId: string;
  collegeId?: string | null;
  departmentId?: string | null;
  visibility?: string;
  uploadedBy?: string | null;
  knowledgeBaseId?: string;
  documentId: string;
  documentName: string;
  documentVersion?: number;
  version?: number; // Compatibility alias for documentVersion
  isLatest?: boolean;
  docHash?: string;
  chunkId: string;
  chunkHash?: string;
  chunkIndex: number;
  chunkText: string;
  pageNumber?: number | null;
  sectionHeader?: string | null;
  createdAt?: string;
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
   * Searches Qdrant using semantic similarity, enforcing strict organization isolation,
   * pre-retrieval authorization filters, and latest version filtering.
   */
  static async similaritySearch(
    vector: number[],
    organizationId: string,
    limit: number = 20,
    documentIds?: string[],
    includeHistorical: boolean = false,
    accessFilter?: { must?: any[]; should?: any[] }
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

      // Enforce latest version retrieval by default
      if (!includeHistorical) {
        mustFilters.push({
          key: "isLatest",
          match: {
            value: true,
          },
        });
      }

      // Inject document filter if specified for retrieval memory boosting or pre-authorized doc scoping
      if (documentIds && documentIds.length > 0) {
        mustFilters.push({
          key: "documentId",
          match: {
            any: documentIds,
          },
        });
      }

      // Merge additional must filters from accessFilter if provided
      if (accessFilter?.must && Array.isArray(accessFilter.must)) {
        for (const item of accessFilter.must) {
          if (item.key !== "organizationId") {
            mustFilters.push(item);
          }
        }
      }

      const filterPayload: any = {
        must: mustFilters,
      };

      // Add should clauses for departmental/college/visibility RBAC isolation
      if (accessFilter?.should && Array.isArray(accessFilter.should) && accessFilter.should.length > 0) {
        filterPayload.should = accessFilter.should;
      }

      const results = await qdrant.search(GLOBAL_COLLECTION_NAME, {
        vector,
        limit,
        with_payload: true,
        filter: filterPayload,
      });

      return results.map((hit) => ({
        payload: hit.payload as unknown as VectorPayload,
        score: hit.score,
      }));
    } catch (error) {
      console.error("[VectorService] Similarity search failed:", error);
      return [];
    }
  }

  /**
   * Deletes all vector points associated with a specific document within an organization.
   */
  static async deleteByDocument(documentId: string, organizationId: string): Promise<void> {
    try {
      await qdrant.delete(GLOBAL_COLLECTION_NAME, {
        wait: true,
        filter: {
          must: [
            { key: "organizationId", match: { value: organizationId } },
            { key: "documentId", match: { value: documentId } },
          ],
        },
      });
      console.log(`[VectorService] Deleted points for documentId=${documentId}, orgId=${organizationId}`);
    } catch (error) {
      console.error(`[VectorService] Failed to delete points for document ${documentId}:`, error);
    }
  }

  /**
   * Purges obsolete vector versions for a document, keeping only the latest documentVersion.
   */
  static async purgeObsoleteDocumentVersions(
    documentId: string,
    organizationId: string,
    currentVersion: number
  ): Promise<void> {
    try {
      await qdrant.delete(GLOBAL_COLLECTION_NAME, {
        wait: true,
        filter: {
          must: [
            { key: "organizationId", match: { value: organizationId } },
            { key: "documentId", match: { value: documentId } },
            { key: "isLatest", match: { value: false } },
          ],
        },
      });
      console.log(`[VectorService] Purged obsolete versions for document ${documentId} (< v${currentVersion})`);
    } catch (error) {
      console.error(`[VectorService] Failed to purge obsolete versions for document ${documentId}:`, error);
    }
  }
}


