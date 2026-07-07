import { db } from "@/server/db/prisma";
import { FusedChunk } from "./fusion.service";

export interface RetrievalLogData {
  query: string;
  organizationId: string;
  vectorResults?: FusedChunk[] | null;
  bm25Results?: FusedChunk[] | null;
  fusionResults?: FusedChunk[] | null;
  rerankedResults?: FusedChunk[] | null;
  latencyMs?: number;
  retrievalType?: string;
  chunksReturned?: number;
  cacheHit?: boolean;
}

export class RetrievalLogService {
  /**
   * Persists a retrieval operation's complete debug trace.
   * This powers the Retrieval Debug dashboard and enables
   * retrieval quality analysis over time.
   */
  static async logRetrieval(data: RetrievalLogData): Promise<string> {
    try {
      const log = await db.retrievalLog.create({
        data: {
          query: data.query,
          organizationId: data.organizationId,
          vectorResults: data.vectorResults ? JSON.parse(JSON.stringify(
            data.vectorResults.map(c => ({
              chunkId: c.chunkId,
              documentName: c.documentName,
              chunkIndex: c.chunkIndex,
              pageNumber: c.pageNumber,
              vectorScore: c.vectorScore,
              vectorRank: c.vectorRank,
              textPreview: c.chunkText.substring(0, 150),
            }))
          )) : undefined,
          bm25Results: data.bm25Results ? JSON.parse(JSON.stringify(
            data.bm25Results.map(c => ({
              chunkId: c.chunkId,
              documentName: c.documentName,
              chunkIndex: c.chunkIndex,
              pageNumber: c.pageNumber,
              bm25Score: c.bm25Score,
              bm25Rank: c.bm25Rank,
              textPreview: c.chunkText.substring(0, 150),
            }))
          )) : undefined,
          fusionResults: data.fusionResults ? JSON.parse(JSON.stringify(
            data.fusionResults.map(c => ({
              chunkId: c.chunkId,
              documentName: c.documentName,
              chunkIndex: c.chunkIndex,
              pageNumber: c.pageNumber,
              vectorScore: c.vectorScore,
              bm25Score: c.bm25Score,
              fusionScore: c.fusionScore,
              fusionRank: c.fusionRank,
              textPreview: c.chunkText.substring(0, 150),
            }))
          )) : undefined,
          rerankedResults: data.rerankedResults ? JSON.parse(JSON.stringify(
            data.rerankedResults.map(c => ({
              chunkId: c.chunkId,
              documentName: c.documentName,
              chunkIndex: c.chunkIndex,
              pageNumber: c.pageNumber,
              vectorScore: c.vectorScore,
              bm25Score: c.bm25Score,
              fusionScore: c.fusionScore,
              textPreview: c.chunkText.substring(0, 150),
            }))
          )) : undefined,
          latencyMs: data.latencyMs,
          retrievalType: data.retrievalType || "hybrid",
          chunksReturned: data.chunksReturned || 0,
          cacheHit: data.cacheHit || false,
        },
      });

      return log.id;
    } catch (error) {
      console.error("[RetrievalLogService] Failed to log retrieval:", error);
      // Non-fatal — logging failures should never break the retrieval pipeline
      return "";
    }
  }

  /**
   * Retrieves a single retrieval log by ID for the debug drill-down view.
   */
  static async getRetrievalLog(queryId: string) {
    try {
      return await db.retrievalLog.findUnique({
        where: { id: queryId },
        include: {
          queryVariants: true,
        },
      });
    } catch (error) {
      console.error("[RetrievalLogService] Failed to fetch log:", error);
      return null;
    }
  }

  /**
   * Retrieves recent retrieval logs for the debug dashboard.
   */
  static async getRecentLogs(
    organizationId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    try {
      const [logs, total] = await Promise.all([
        db.retrievalLog.findMany({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
          select: {
            id: true,
            query: true,
            retrievalType: true,
            chunksReturned: true,
            latencyMs: true,
            cacheHit: true,
            createdAt: true,
            rerankedResults: true,
            queryVariants: {
              select: {
                rewrittenQuery: true,
                variantType: true,
              },
            },
          },
        }),
        db.retrievalLog.count({
          where: { organizationId },
        }),
      ]);

      return { logs, total };
    } catch (error) {
      console.error("[RetrievalLogService] Failed to fetch recent logs:", error);
      return { logs: [], total: 0 };
    }
  }

  /**
   * Retrieves aggregate stats for the retrieval debug dashboard.
   */
  static async getStats(organizationId: string) {
    try {
      const [totalQueries, avgLatency, cacheHits, typeCounts] = await Promise.all([
        db.retrievalLog.count({
          where: { organizationId },
        }),
        db.retrievalLog.aggregate({
          where: { organizationId },
          _avg: { latencyMs: true },
        }),
        db.retrievalLog.count({
          where: { organizationId, cacheHit: true },
        }),
        db.retrievalLog.groupBy({
          by: ["retrievalType"],
          where: { organizationId },
          _count: true,
        }),
      ]);

      const cacheHitRate = totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0;
      const hybridCount = typeCounts.find(t => t.retrievalType === "hybrid")?._count ?? 0;
      const vectorOnlyCount = typeCounts.find(t => t.retrievalType === "vector")?._count ?? 0;

      return {
        totalQueries,
        avgLatencyMs: avgLatency._avg.latencyMs ?? 0,
        cacheHitRate: Math.round(cacheHitRate * 10) / 10,
        hybridRatio: totalQueries > 0
          ? Math.round((hybridCount / totalQueries) * 100)
          : 0,
        vectorOnlyCount,
        hybridCount,
      };
    } catch (error) {
      console.error("[RetrievalLogService] Failed to compute stats:", error);
      return {
        totalQueries: 0,
        avgLatencyMs: 0,
        cacheHitRate: 0,
        hybridRatio: 0,
        vectorOnlyCount: 0,
        hybridCount: 0,
      };
    }
  }
}
