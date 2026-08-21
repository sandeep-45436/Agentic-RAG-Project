import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { syncUserToDatabase } from "@/server/actions/auth";
import { UsageType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const insforge = await createClient();
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let membership = await db.membership.findFirst({ where: { userId: user.id } });
    if (!membership) {
      await syncUserToDatabase();
      membership = await db.membership.findFirst({ where: { userId: user.id } });
      if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    const { organizationId } = membership;

    // Parse body if present for custom inputs, otherwise randomize
    let typeInput = "";
    try {
      const body = await req.json();
      typeInput = body.type || "";
    } catch {
      // Body might be empty or invalid, ignore
    }

    const types = [
      UsageType.CHAT,
      UsageType.EMBEDDING,
      UsageType.RETRIEVAL,
      UsageType.GRAPH_QUERY,
      UsageType.AGENT_EXECUTION,
    ];

    // Determine type
    let type: UsageType = UsageType.CHAT;
    if (typeInput && types.includes(typeInput as UsageType)) {
      type = typeInput as UsageType;
    } else {
      const rand = Math.random();
      if (rand < 0.35) type = UsageType.CHAT;
      else if (rand < 0.55) type = UsageType.EMBEDDING;
      else if (rand < 0.75) type = UsageType.RETRIEVAL;
      else if (rand < 0.9) type = UsageType.AGENT_EXECUTION;
      else type = UsageType.GRAPH_QUERY;
    }

    const models = ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet", "text-embedding-3-small"];
    const model = type === UsageType.EMBEDDING ? models[3] : models[Math.floor(Math.random() * 3)];
    
    // Randomize latency (ms) - ultra-fast sub-50ms SLA
    let latencyMs = 28;
    if (type === UsageType.CHAT) latencyMs = Math.floor(Math.random() * 15) + 25; // 25-40ms
    else if (type === UsageType.EMBEDDING) latencyMs = Math.floor(Math.random() * 10) + 12; // 12-22ms
    else if (type === UsageType.RETRIEVAL) latencyMs = Math.floor(Math.random() * 15) + 18; // 18-33ms
    else if (type === UsageType.AGENT_EXECUTION) latencyMs = Math.floor(Math.random() * 15) + 30; // 30-45ms
    else if (type === UsageType.GRAPH_QUERY) latencyMs = Math.floor(Math.random() * 15) + 22; // 22-37ms

    const tokensInput = type === UsageType.EMBEDDING ? Math.floor(Math.random() * 800) + 100 : Math.floor(Math.random() * 1000) + 150;
    const tokensOutput = type === UsageType.CHAT ? Math.floor(Math.random() * 1500) + 100 : 0;
    
    let estimatedCost = 0;
    if (type === UsageType.CHAT) {
      estimatedCost = (tokensInput * 0.000005) + (tokensOutput * 0.000015);
    } else if (type === UsageType.EMBEDDING) {
      estimatedCost = tokensInput * 0.0000001;
    } else {
      estimatedCost = 0.0002;
    }

    const event = await db.usageEvent.create({
      data: {
        organizationId,
        userId: user.id,
        type,
        model,
        tokensInput,
        tokensOutput,
        embeddingTokens: type === UsageType.EMBEDDING ? tokensInput : null,
        latencyMs,
        estimatedCost,
      },
    });

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        type: event.type,
        model: event.model,
        latencyMs: event.latencyMs,
        tokensInput: event.tokensInput,
        tokensOutput: event.tokensOutput,
        createdAt: event.createdAt,
      }
    });
  } catch (error: unknown) {
    console.error("GET /api/analytics/simulate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
