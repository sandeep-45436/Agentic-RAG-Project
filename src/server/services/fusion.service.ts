import { VectorPayload } from "./vector.service";
import { BM25Result } from "./bm25.service";

/**
 * A unified chunk representation that carries scores from all retrieval methods.
 */
export interface FusedChunk {
  chunkId: string;
  documentId: string;
  documentName: string;
  organizationId: string;
  chunkText: string;
  chunkIndex: number;
  pageNumber: number | null;
  knowledgeBaseId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  // Individual retrieval scores
  vectorScore: number | null;
  vectorRank: number | null;
  bm25Score: number | null;
  bm25Rank: number | null;
  // Fused score
  fusionScore: number;
  fusionRank: number;
}

export class FusionService {
  /**
   * Implements Reciprocal Rank Fusion (RRF) to merge results from
   * vector search and BM25 keyword search into a single ranked list.
   *
   * RRF Formula: score(d) = Σ 1/(k + rank_i(d)) for each ranking system i
   *
   * This is the standard fusion technique used in hybrid retrieval:
   * - No score normalization needed (vector cosine similarity and BM25 use different scales)
   * - Computationally cheap — no training or external infrastructure
   * - Strong baseline that often outperforms ML-based fusion in zero-shot settings
   *
   * @param vectorResults - Ranked results from Qdrant semantic search
   * @param bm25Results - Ranked results from PostgreSQL full-text search
   * @param k - Smoothing constant (default 60, standard in literature)
   * @param limit - Maximum fused results to return
   * @returns Merged, deduplicated, and re-ranked results
   */
  static reciprocalRankFusion(
    vectorResults: Array<{
      payload: VectorPayload;
      score: number;
    }>,
    bm25Results: BM25Result[],
    k: number = 60,
    limit: number = 20
  ): FusedChunk[] {
    const fusedMap = new Map<string, FusedChunk>();

    // Process vector results
    for (let rank = 0; rank < vectorResults.length; rank++) {
      const result = vectorResults[rank];
      const payload = result.payload;
      const chunkId = payload.chunkId;

      const existing = fusedMap.get(chunkId);
      const rrfContribution = 1 / (k + rank + 1); // rank is 0-indexed, RRF uses 1-indexed

      if (existing) {
        existing.vectorScore = result.score;
        existing.vectorRank = rank + 1;
        existing.fusionScore += rrfContribution;
      } else {
        fusedMap.set(chunkId, {
          chunkId,
          documentId: payload.documentId,
          documentName: payload.documentName,
          organizationId: payload.organizationId,
          chunkText: payload.chunkText,
          chunkIndex: payload.chunkIndex,
          pageNumber: (payload as any).pageNumber ?? null,
          knowledgeBaseId: payload.knowledgeBaseId,
          tags: payload.tags,
          metadata: payload.metadata,
          vectorScore: result.score,
          vectorRank: rank + 1,
          bm25Score: null,
          bm25Rank: null,
          fusionScore: rrfContribution,
          fusionRank: 0, // Will be assigned after sorting
        });
      }
    }

    // Process BM25 results
    for (let rank = 0; rank < bm25Results.length; rank++) {
      const result = bm25Results[rank];
      const chunkId = result.chunkId;

      const existing = fusedMap.get(chunkId);
      const rrfContribution = 1 / (k + rank + 1);

      if (existing) {
        existing.bm25Score = result.bm25Score;
        existing.bm25Rank = rank + 1;
        existing.fusionScore += rrfContribution;
        // Merge any missing data from BM25 result
        if (!existing.pageNumber && result.pageNumber) {
          existing.pageNumber = result.pageNumber;
        }
      } else {
        fusedMap.set(chunkId, {
          chunkId,
          documentId: result.documentId,
          documentName: "Unknown", // BM25 results don't carry document name; will be enriched later
          organizationId: result.organizationId,
          chunkText: result.content,
          chunkIndex: result.chunkIndex,
          pageNumber: result.pageNumber,
          vectorScore: null,
          vectorRank: null,
          bm25Score: result.bm25Score,
          bm25Rank: rank + 1,
          fusionScore: rrfContribution,
          fusionRank: 0,
        });
      }
    }

    // Sort by fusion score descending and assign final ranks
    const sorted = Array.from(fusedMap.values())
      .sort((a, b) => b.fusionScore - a.fusionScore)
      .slice(0, limit);

    sorted.forEach((chunk, index) => {
      chunk.fusionRank = index + 1;
    });

    return sorted;
  }

  /**
   * Enriches BM25-only results with document names by looking up
   * the document records. This fills the gap where BM25 results
   * from raw SQL queries don't carry document metadata.
   * Mutates chunks in-place.
   */
  static enrichDocumentNames(
    chunks: FusedChunk[],
    documentNameMap: Map<string, string>
  ): void {
    chunks.forEach((chunk) => {
      if (chunk.documentName === "Unknown" && documentNameMap.has(chunk.documentId)) {
        chunk.documentName = documentNameMap.get(chunk.documentId) || "Unknown";
      }
    });
  }

  /**
   * Converts FusedChunk results back to VectorPayload format
   * for compatibility with existing reranking and compression services.
   */
  static toVectorPayloads(fusedChunks: FusedChunk[]): VectorPayload[] {
    return fusedChunks.map((chunk) => ({
      organizationId: chunk.organizationId,
      documentId: chunk.documentId,
      documentName: chunk.documentName,
      chunkId: chunk.chunkId,
      chunkIndex: chunk.chunkIndex,
      chunkText: chunk.chunkText,
      knowledgeBaseId: chunk.knowledgeBaseId,
      tags: chunk.tags,
      metadata: {
        ...chunk.metadata,
        pageNumber: chunk.pageNumber,
        vectorScore: chunk.vectorScore,
        bm25Score: chunk.bm25Score,
        fusionScore: chunk.fusionScore,
        fusionRank: chunk.fusionRank,
      },
    }));
  }
}
