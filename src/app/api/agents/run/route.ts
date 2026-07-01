import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/server/db/prisma";
import { syncUserToDatabase } from "@/server/actions/auth";
import { UsageType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let membership = await db.membership.findFirst({ where: { userId: user.id } });
    if (!membership) {
      await syncUserToDatabase();
      membership = await db.membership.findFirst({ where: { userId: user.id } });
      if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    const { organizationId } = membership;

    const { agentId } = await req.json();
    if (!agentId) {
      return NextResponse.json({ error: "Missing agentId" }, { status: 400 });
    }

    const agent = await db.agent.findFirst({
      where: { id: agentId, organizationId, deletedAt: null },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Determine success with 98% probability
    const isSuccess = Math.random() < 0.98;
    const latencyMs = Math.floor(Math.random() * 1500) + 400; // 400ms to 1900ms
    const tokensInput = Math.floor(Math.random() * 500) + 100;
    const tokensOutput = isSuccess ? Math.floor(Math.random() * 800) + 150 : 0;
    const estimatedCost = (tokensInput * 0.0000015) + (tokensOutput * 0.000002);

    // Save to UsageEvent table
    const event = await db.usageEvent.create({
      data: {
        organizationId,
        userId: user.id,
        type: UsageType.AGENT_EXECUTION,
        model: "gpt-4o-mini",
        tokensInput,
        tokensOutput,
        latencyMs,
        estimatedCost,
        metadata: {
          agentId,
          status: isSuccess ? "success" : "failed",
        },
      },
    });

    return NextResponse.json({
      success: true,
      result: {
        eventId: event.id,
        status: isSuccess ? "success" : "failed",
        latencyMs,
        estimatedCost,
      },
    });
  } catch (error: unknown) {
    console.error("POST /api/agents/run error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
