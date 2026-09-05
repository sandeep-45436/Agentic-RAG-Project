/** POST /api/research/notebooks/:id/sync — re-sync stale/failed sources */
import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { DocumentAccessPolicy } from "@/server/services/document-access-policy";
import { ResearchNotebookService } from "@/server/services/research-notebook.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    if (!userData?.user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    const userId = userData.user.id;
    const membership = await db.membership.findFirst({ where: { userId, deletedAt: null } });
    if (!membership) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const provCtx = await DocumentAccessPolicy.resolveFacultyAccessContext(userId, membership.organizationId);
    const ctx = {
      userId,
      organizationId: membership.organizationId,
      departmentId: provCtx.departmentId ?? null,
      collegeId: provCtx.collegeId ?? null,
      userRole: provCtx.userRole ?? "MEMBER",
    };

    await ResearchNotebookService.syncNotebook(ctx, params.id);
    return NextResponse.json({ success: true, message: "Sync triggered" }, { status: 202 });
  } catch (err: any) {
    if (err.message === "RESEARCH_ACCESS_DENIED") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
