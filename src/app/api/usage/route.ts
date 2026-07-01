import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/server/db/prisma";
import { syncUserToDatabase } from "@/server/actions/auth";
import { BillingService } from "@/server/services/billing";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get plan limits (auto-creates free tier if missing)
    const limits = await BillingService.getPlanLimits(organizationId);

    const [chatCount, embeddingTokens, documents, storageBytes] = await Promise.all([
      // Messages this month
      db.usageEvent.count({
        where: { organizationId, type: "CHAT", createdAt: { gte: startOfMonth } },
      }),
      // Embedding tokens this month
      db.usageEvent.aggregate({
        where: { organizationId, type: "EMBEDDING", createdAt: { gte: startOfMonth } },
        _sum: { embeddingTokens: true },
      }),
      // Document count
      db.document.count({
        where: { organizationId, processingStatus: "COMPLETED", deletedAt: null },
      }),
      // Total storage (sum of fileSize)
      db.document.aggregate({
        where: { organizationId, deletedAt: null },
        _sum: { fileSize: true },
      }),
    ]);

    const usedEmbeddingTokens = embeddingTokens._sum.embeddingTokens ?? 0;
    const usedStorageBytes = storageBytes._sum.fileSize ?? 0;

    return NextResponse.json({
      chat: { used: chatCount, limit: limits.messagesPerMonth },
      embeddings: { used: usedEmbeddingTokens, limit: limits.embeddingQuota },
      documents: { used: documents, limit: limits.documentQuota },
      storage: {
        usedBytes: usedStorageBytes,
        limitBytes: Number(limits.storageQuotaBytes),
      },
    });
  } catch (error: any) {
    console.error("GET /api/usage error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
