import { createClient } from "@/utils/insforge/server";
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
    const insforge = await createClient();
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
    const user = userData?.user;

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

    // Parse DB lists
    const fusionList = Array.isArray(log.fusionResults) ? log.fusionResults : [];
    const rerankedList = Array.isArray(log.rerankedResults) ? log.rerankedResults : [];

    // 5. Compute detailed before/after comparison trace
    const traces = rerankedList.map((chunk: any, finalIndex: number) => {
      // Find where this chunk was in the initial RRF list
      const initialRank = fusionList.findIndex((c: any) => c.chunkId === chunk.chunkId);
      const initialChunk = initialRank !== -1 ? (fusionList[initialRank] as any) : null;

      return {
        chunkId: chunk.chunkId,
        documentName: chunk.documentName || "Unknown Document",
        chunkIndex: chunk.chunkIndex || 0,
        textPreview: chunk.textPreview || "",
        
        // Before reranking
        initialRank: initialRank !== -1 ? initialRank + 1 : null,
        initialFusionScore: initialChunk?.fusionScore ?? null,
        initialVectorScore: initialChunk?.vectorScore ?? null,
        initialBm25Score: initialChunk?.bm25Score ?? null,

        // After reranking
        finalRank: finalIndex + 1,
        finalRerankScore: chunk.vectorScore ?? chunk.fusionScore ?? null, // Stored vectorScore represents rerankScore in DB logs
        
        // Rank shift (+ means moved up, - means moved down)
        rankShift: initialRank !== -1 ? (initialRank + 1) - (finalIndex + 1) : null,
      };
    });

    return NextResponse.json({
      query: log.query,
      latencyMs: log.latencyMs,
      retrievalType: log.retrievalType,
      traces,
      raw: {
        fusionList,
        rerankedList,
      }
    });
  } catch (error: any) {
    console.error("[GET /api/debug/rerank/[queryId]] Error:", error);
    return new NextResponse(error.message || "Internal server error", { status: 500 });
  }
}
