/**
 * GET    /api/research/notebooks/:id  — full notebook detail
 * DELETE /api/research/notebooks/:id  — soft-delete notebook
 */
import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { DocumentAccessPolicy } from "@/server/services/document-access-policy";
import { ResearchNotebookService } from "@/server/services/research-notebook.service";

export const dynamic = "force-dynamic";

async function resolveContext(userId: string, organizationId: string) {
  const ctx = await DocumentAccessPolicy.resolveFacultyAccessContext(userId, organizationId);
  return {
    userId,
    organizationId,
    departmentId: ctx.departmentId ?? null,
    collegeId: ctx.collegeId ?? null,
    userRole: ctx.userRole ?? "MEMBER",
  };
}

async function getAuth(req: Request) {
  const insforge = await createClient();
  const { data: userData } = await insforge.auth.getCurrentUser();
  if (!userData?.user) return null;
  const userId = userData.user.id;
  const membership = await db.membership.findFirst({ where: { userId, deletedAt: null } });
  if (!membership) return null;
  return { userId, organizationId: membership.organizationId };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const ctx = await resolveContext(auth.userId, auth.organizationId);
    const { notebook, sources } = await ResearchNotebookService.getNotebookStatus(ctx, id);
    return NextResponse.json({ notebook, sources });
  } catch (err: any) {
    if (err.message === "NOTEBOOK_NOT_FOUND") return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (err.message === "RESEARCH_ACCESS_DENIED") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const ctx = await resolveContext(auth.userId, auth.organizationId);
    await ResearchNotebookService.deleteNotebook(ctx, id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "RESEARCH_ACCESS_DENIED") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
