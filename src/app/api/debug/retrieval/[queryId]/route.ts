import { createClient } from "@/utils/supabase/server";
import { db } from "@/server/db/prisma";
import { RetrievalLogService } from "@/server/services/retrieval-log.service";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ queryId: string }> }
) {
  try {
    const { queryId } = await params;

    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Fetch user's organization membership
    const membership = await db.membership.findFirst({
      where: { userId: user.id },
    });

    if (!membership) {
      return new NextResponse("Forbidden - No active membership found", { status: 403 });
    }

    // 3. Fetch retrieval log
    const log = await RetrievalLogService.getRetrievalLog(queryId);

    if (!log) {
      return new NextResponse("Retrieval log not found", { status: 404 });
    }

    // 4. Secure multi-tenant boundary: verify organization matches
    if (log.organizationId !== membership.organizationId) {
      return new NextResponse("Forbidden - Resource belongs to another organization", { status: 403 });
    }

    const chunksList = Array.isArray(log.rerankedResults)
      ? log.rerankedResults
      : [];

    let confidence: "high" | "medium" | "low" = "medium";
    if (chunksList.length > 0) {
      const scores = chunksList.map((c: any) => c.fusionScore || 0);
      const avgScore = scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length;
      if (avgScore >= 0.7) confidence = "high";
      else if (avgScore < 0.4) confidence = "low";
    } else {
      confidence = "low";
    }

    const variantsList = Array.isArray(log.queryVariants) ? log.queryVariants : [];
    const rewrittenQuery = variantsList.find((v: any) => v.variantType === "rewrite")?.rewrittenQuery || null;
    const expansions = variantsList.filter((v: any) => v.variantType === "expansion").map((v: any) => v.rewrittenQuery);

    return NextResponse.json({
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
      // Include raw inputs for deep technical inspection
      raw: {
        vectorResults: log.vectorResults,
        bm25Results: log.bm25Results,
        fusionResults: log.fusionResults,
      }
    });
  } catch (error: any) {
    console.error("[GET /api/debug/retrieval/[queryId]] Error:", error);
    return new NextResponse(error.message || "Internal server error", { status: 500 });
  }
}
