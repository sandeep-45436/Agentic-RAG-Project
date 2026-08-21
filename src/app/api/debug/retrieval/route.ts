import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { RetrievalLogService } from "@/server/services/retrieval-log.service";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData?.user;

    if (!user) {
      return NextResponse.json({
        stats: { totalQueries: 0, avgLatencyMs: 0, cacheHitRate: 0, hybridRatio: 0 },
        logs: [],
        total: 0,
      });
    }

    const membership = await db.membership.findFirst({
      where: { userId: user.id },
    });

    if (!membership) {
      return NextResponse.json({
        stats: { totalQueries: 0, avgLatencyMs: 0, cacheHitRate: 0, hybridRatio: 0 },
        logs: [],
        total: 0,
      });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || "50"), 100);
    const offset = Math.max(Number(searchParams.get("offset") || "0"), 0);

    const [stats, logsData] = await Promise.all([
      RetrievalLogService.getStats(membership.organizationId),
      RetrievalLogService.getRecentLogs(membership.organizationId, limit, offset),
    ]);

    const mappedLogs = logsData.logs.map((log: any) => {
      const chunksList = Array.isArray(log.rerankedResults)
        ? log.rerankedResults
        : [];

      let confidence: "high" | "medium" | "low" = "medium";
      if (chunksList.length >= 4) {
        confidence = "high";
      } else if (chunksList.length >= 1) {
        confidence = "medium";
      } else {
        confidence = "low";
      }

      const variantsList = Array.isArray(log.queryVariants) ? log.queryVariants : [];
      const rewrittenQuery = variantsList.find((v: any) => v.variantType === "rewrite")?.rewrittenQuery || null;
      const expansions = variantsList.filter((v: any) => v.variantType === "expansion").map((v: any) => v.rewrittenQuery);

      return {
        id: log.id,
        query: log.query,
        rewrittenQuery,
        expansions,
        type: log.retrievalType === "vector" ? "vector" : log.retrievalType === "bm25" ? "bm25" : "hybrid",
        chunksFound: log.chunksReturned,
        latencyMs: Math.round(log.latencyMs || 0),
        timestamp: log.createdAt.toISOString(),
        confidence,
        chunks: chunksList.map((c: any) => ({
          documentName: c.documentName || "Unknown Document",
          chunkIndex: c.chunkIndex || 0,
          vectorScore: c.vectorScore !== undefined ? c.vectorScore : null,
          bm25Score: c.bm25Score !== undefined ? c.bm25Score : null,
          fusionScore: c.fusionScore !== undefined ? c.fusionScore : null,
        })),
      };
    });

    return NextResponse.json({
      stats: {
        totalQueries: stats.totalQueries,
        avgLatencyMs: Math.round(stats.avgLatencyMs),
        cacheHitRate: stats.cacheHitRate,
        hybridRatio: stats.hybridRatio,
      },
      logs: mappedLogs,
      total: logsData.total,
    });
  } catch (error: any) {
    console.error("[GET /api/debug/retrieval] Error:", error);
    return NextResponse.json({
      stats: { totalQueries: 0, avgLatencyMs: 0, cacheHitRate: 0, hybridRatio: 0 },
      logs: [],
      total: 0,
    });
  }
}
