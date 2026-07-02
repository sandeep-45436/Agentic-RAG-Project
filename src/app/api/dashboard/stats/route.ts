import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/server/db/prisma";
import { syncUserToDatabase } from "@/server/actions/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  let orgIdForLog: string | null = null;
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
    orgIdForLog = organizationId;
    const now = new Date();

    // Date helpers
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ── Core stat counts ─────────────────────────────────────────────────────
    const [
      totalDocs,
      totalDocsLastMonth,
      totalConversations,
      totalConversationsLastMonth,
      totalMembers,
      totalMembersLastMonth,
      totalTokensResult,
      totalTokensLastMonthResult,
    ] = await Promise.all([
      db.document.count({ where: { organizationId, deletedAt: null } }),
      db.document.count({ where: { organizationId, deletedAt: null, createdAt: { lt: thirtyDaysAgo } } }),
      db.conversation.count({ where: { organizationId, deletedAt: null } }),
      db.conversation.count({ where: { organizationId, deletedAt: null, createdAt: { lt: thirtyDaysAgo } } }),
      db.membership.count({ where: { organizationId, deletedAt: null } }),
      db.membership.count({ where: { organizationId, deletedAt: null, createdAt: { lt: thirtyDaysAgo } } }),
      db.usageEvent.aggregate({
        where: { organizationId },
        _sum: { tokensInput: true, tokensOutput: true, embeddingTokens: true },
      }),
      db.usageEvent.aggregate({
        where: { organizationId, createdAt: { lt: thirtyDaysAgo } },
        _sum: { tokensInput: true, tokensOutput: true, embeddingTokens: true },
      }),
    ]);

    const totalTokens =
      (totalTokensResult._sum.tokensInput ?? 0) +
      (totalTokensResult._sum.tokensOutput ?? 0) +
      (totalTokensResult._sum.embeddingTokens ?? 0);

    const totalTokensLastMonth =
      (totalTokensLastMonthResult._sum.tokensInput ?? 0) +
      (totalTokensLastMonthResult._sum.tokensOutput ?? 0) +
      (totalTokensLastMonthResult._sum.embeddingTokens ?? 0);

    // ── Token usage chart — last 30 days, grouped by day ─────────────────────
    const usageEvents = await db.usageEvent.findMany({
      where: { organizationId, createdAt: { gte: thirtyDaysAgo } },
      select: {
        createdAt: true,
        tokensInput: true,
        tokensOutput: true,
        embeddingTokens: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Build daily buckets for the last 30 days
    const dailyMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyMap[key] = 0;
    }
    for (const e of usageEvents) {
      const key = new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (key in dailyMap) {
        dailyMap[key] +=
          (e.tokensInput ?? 0) + (e.tokensOutput ?? 0) + (e.embeddingTokens ?? 0);
      }
    }
    const tokenChart = Object.entries(dailyMap).map(([date, tokens]) => ({ date, tokens }));

    // ── Storage breakdown ─────────────────────────────────────────────────────
    const [docStorage, embeddingStorage] = await Promise.all([
      db.document.aggregate({
        where: { organizationId, deletedAt: null },
        _sum: { fileSize: true },
      }),
      db.chunk.count({ where: { organizationId, deletedAt: null } }),
    ]);

    const docStorageBytes = docStorage._sum.fileSize ?? 0;
    // Rough estimate: each chunk vector ~6KB (1536 floats × 4 bytes)
    const embeddingStorageBytes = embeddingStorage * 6 * 1024;
    const kbStorageBytes = embeddingStorage * 512; // graph index rough estimate
    const otherBytes = 1024 * 1024; // 1 MB misc
    const totalStorageBytes = docStorageBytes + embeddingStorageBytes + kbStorageBytes + otherBytes;
    const storageLimitBytes = 200 * 1024 * 1024 * 1024; // 200 GB plan

    // ── Recent activity ───────────────────────────────────────────────────────
    const [recentDocs, recentConvs] = await Promise.all([
      db.document.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: { id: true, fileName: true, processingStatus: true, updatedAt: true },
      }),
      db.conversation.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: { id: true, title: true, updatedAt: true },
      }),
    ]);

    const activity = [
      ...recentDocs.map((d) => ({
        id: d.id,
        type: "document" as const,
        label: "Document processed",
        sublabel: d.fileName,
        time: d.updatedAt.toISOString(),
      })),
      ...recentConvs.map((c) => ({
        id: c.id,
        type: "chat" as const,
        label: "New conversation",
        sublabel: c.title ?? "Untitled chat",
        time: c.updatedAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);

    // ── Top knowledge bases (proxy for "top agents" in the screenshot) ────────
    const kbs = await db.knowledgeBase.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        _count: {
          select: {
            documents: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    const topKBs = kbs.map((kb) => ({
      id: kb.id,
      name: kb.name,
      runs: kb._count.documents,
    }));

    // ── Trend helpers ─────────────────────────────────────────────────────────
    const pct = (current: number, previous: number) => {
      if (previous === 0) return null;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    return NextResponse.json({
      stats: {
        totalDocs,
        docsTrend: pct(totalDocs, totalDocsLastMonth),
        totalConversations,
        conversationsTrend: pct(totalConversations, totalConversationsLastMonth),
        totalTokens,
        tokensTrend: pct(totalTokens, totalTokensLastMonth),
        totalMembers,
        membersTrend: pct(totalMembers, totalMembersLastMonth),
      },
      tokenChart,
      storage: {
        docBytes: docStorageBytes,
        embeddingBytes: embeddingStorageBytes,
        kbBytes: kbStorageBytes,
        otherBytes,
        totalBytes: totalStorageBytes,
        limitBytes: storageLimitBytes,
      },
      activity,
      topKBs,
      user: {
        email: user.email ?? "",
        name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
      },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    try {
      const { AuditService } = require("@/server/services/audit");
      const fallbackOrg = await db.organization.findFirst();
      await AuditService.logEvent({
        orgId: orgIdForLog || fallbackOrg?.id || "system",
        action: "DASHBOARD_STATS_ERROR",
        metadata: {
          message: error.message || String(error),
          stack: error.stack || null,
        }
      });
    } catch (dbLogErr) {
      console.error("Failed to write stats error to AuditLog:", dbLogErr);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
