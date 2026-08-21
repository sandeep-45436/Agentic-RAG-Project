import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { syncUserToDatabase } from "@/server/actions/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const missingEnvs: string[] = [];
  if (!process.env.DATABASE_URL) missingEnvs.push("DATABASE_URL");
  if (!process.env.NEXT_PUBLIC_INSFORGE_URL) missingEnvs.push("NEXT_PUBLIC_INSFORGE_URL");
  if (!process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY) missingEnvs.push("NEXT_PUBLIC_INSFORGE_ANON_KEY");

  if (missingEnvs.length > 0) {
    return NextResponse.json({
      error: `Missing environment variable(s) on Vercel: ${missingEnvs.join(", ")}. Please configure them in your Vercel Project Settings and redeploy.`
    }, { status: 500 });
  }

  let orgIdForLog: string | null = null;
  try {
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    let user = userData?.user;
    let membership = null;

    if (user) {
      try {
        membership = await db.membership.findFirst({ where: { userId: user.id } });
      } catch (connErr) {
        console.warn("[DashboardStats] Retrying membership lookup after connection retry...", connErr);
        await new Promise((r) => setTimeout(r, 500));
        membership = await db.membership.findFirst({ where: { userId: user.id } });
      }

      if (!membership) {
        await syncUserToDatabase();
        membership = await db.membership.findFirst({ where: { userId: user.id } });
      }
    }

    // If still no membership, fallback to the primary workspace organization
    let organizationId = membership?.organizationId;
    if (!organizationId) {
      const defaultOrg = await db.organization.findFirst({ where: { deletedAt: null } });
      if (defaultOrg) {
        organizationId = defaultOrg.id;
      } else {
        const newOrg = await db.organization.create({ data: { name: "Default Organization" } });
        organizationId = newOrg.id;
      }
    }
    orgIdForLog = organizationId;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

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

    const [docStorage, embeddingStorage] = await Promise.all([
      db.document.aggregate({
        where: { organizationId, deletedAt: null },
        _sum: { fileSize: true },
      }),
      db.chunk.count({ where: { organizationId, deletedAt: null } }),
    ]);

    const docStorageBytes = docStorage._sum.fileSize ?? 0;
    const embeddingStorageBytes = embeddingStorage * 6 * 1024;
    const kbStorageBytes = embeddingStorage * 512;
    const otherBytes = 1024 * 1024;
    const totalStorageBytes = docStorageBytes + embeddingStorageBytes + kbStorageBytes + otherBytes;
    const storageLimitBytes = 200 * 1024 * 1024 * 1024;

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
        email: user?.email ?? "",
        name: (user as any)?.profile?.name ?? user?.email?.split("@")[0] ?? "User",
      },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({
      stats: {
        totalDocs: 0,
        docsTrend: null,
        totalConversations: 0,
        conversationsTrend: null,
        totalTokens: 0,
        tokensTrend: null,
        totalMembers: 1,
        membersTrend: null,
      },
      tokenChart: [],
      storage: { docBytes: 0, embeddingBytes: 0, kbBytes: 0, otherBytes: 1048576, totalBytes: 1048576, limitBytes: 214748364800 },
      activity: [],
      topKBs: [],
      user: { email: "", name: "User" },
    });
  }
}
