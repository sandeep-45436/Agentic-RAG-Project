import { db } from "@/server/db/prisma";

export interface BM25Result {
  chunkId: string;
  documentId: string;
  organizationId: string;
  content: string;
  pageNumber: number | null;
  chunkIndex: number;
  bm25Score: number;
  rank: number;
}

export class BM25Service {
  /**
   * Performs BM25-style keyword retrieval using PostgreSQL full-text search.
   * Uses ts_rank_cd (Cover Density) for proximity-aware ranking.
   *
   * @param query - The user's search query
   * @param organizationId - Tenant isolation filter
   * @param limit - Maximum results to return (default 20)
   * @returns Ranked results with BM25 scores normalized to [0, 1]
   */
  static async search(
    query: string,
    organizationId: string,
    limit: number = 20,
    documentIds?: string[]
  ): Promise<BM25Result[]> {
    if (!query.trim()) return [];

    try {
      const filterDocs = documentIds && documentIds.length > 0;
      const docsArray = filterDocs ? documentIds : [];

      // Use websearch_to_tsquery for natural language queries
      // This handles quoted phrases, minus signs, and implicit AND
      const results = await db.$queryRaw<
        Array<{
          id: string;
          documentId: string;
          organizationId: string;
          content: string;
          pageNumber: number | null;
          chunkIndex: number;
          rank: number;
        }>
      >`
        SELECT 
          c."id",
          c."documentId",
          c."organizationId",
          c."content",
          c."pageNumber",
          c."chunkIndex",
          ts_rank_cd(c."search_vector", query) AS rank
        FROM "Chunk" c, websearch_to_tsquery('english', ${query}) AS query
        WHERE c."search_vector" @@ query
          AND c."organizationId" = ${organizationId}
          AND c."deletedAt" IS NULL
          AND (${!filterDocs} OR c."documentId" = ANY(${docsArray}))
        ORDER BY rank DESC
        LIMIT ${limit}
      `;

      if (results.length === 0) {
        // Fallback to plainto_tsquery for simpler matching
        // websearch_to_tsquery may fail on certain query patterns
        const fallbackResults = await db.$queryRaw<
          Array<{
            id: string;
            documentId: string;
            organizationId: string;
            content: string;
            pageNumber: number | null;
            chunkIndex: number;
            rank: number;
          }>
        >`
          SELECT 
            c."id",
            c."documentId",
            c."organizationId",
            c."content",
            c."pageNumber",
            c."chunkIndex",
            ts_rank_cd(c."search_vector", query) AS rank
          FROM "Chunk" c, plainto_tsquery('english', ${query}) AS query
          WHERE c."search_vector" @@ query
            AND c."organizationId" = ${organizationId}
            AND c."deletedAt" IS NULL
            AND (${!filterDocs} OR c."documentId" = ANY(${docsArray}))
          ORDER BY rank DESC
          LIMIT ${limit}
        `;

        return BM25Service.normalizeResults(fallbackResults);
      }

      return BM25Service.normalizeResults(results);
    } catch (error) {
      console.error("[BM25Service] Full-text search failed:", error);
      // Return empty array instead of throwing — BM25 failures should not
      // break the hybrid pipeline; vector search can still provide results
      return [];
    }
  }

  /**
   * Normalizes raw PostgreSQL ts_rank_cd scores to [0, 1] range
   * and maps results to the BM25Result interface.
   */
  private static normalizeResults(
    rawResults: Array<{
      id: string;
      documentId: string;
      organizationId: string;
      content: string;
      pageNumber: number | null;
      chunkIndex: number;
      rank: number;
    }>
  ): BM25Result[] {
    if (rawResults.length === 0) return [];

    // Normalize scores: divide by max score to get [0, 1] range
    const maxScore = Math.max(...rawResults.map((r) => Number(r.rank)));
    const safeMax = maxScore > 0 ? maxScore : 1;

    return rawResults.map((row, index) => ({
      chunkId: row.id,
      documentId: row.documentId,
      organizationId: row.organizationId,
      content: row.content,
      pageNumber: row.pageNumber,
      chunkIndex: row.chunkIndex,
      bm25Score: Number(row.rank) / safeMax,
      rank: index + 1,
    }));
  }

  /**
   * Checks if the BM25 search infrastructure is available.
   * Useful for graceful degradation if the tsvector column hasn't been created yet.
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const result = await db.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Chunk' 
          AND column_name = 'search_vector'
        ) AS exists
      `;
      return result[0]?.exists === true;
    } catch {
      return false;
    }
  }
}
