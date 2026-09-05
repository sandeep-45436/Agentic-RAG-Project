/**
 * POST   /api/research/notebooks/:id/sources  — add document sources
 * DELETE /api/research/notebooks/:id/sources  — remove a document source (documentId in body)
 */
import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { DocumentAccessPolicy } from "@/server/services/document-access-policy";
import { ResearchNotebookService } from "@/server/services/research-notebook.service";

export const dynamic = "force-dynamic";

async function getCtx(req: Request) {
  const insforge = await createClient();
  const { data: userData } = await insforge.auth.getCurrentUser();
  if (!userData?.user) return null;
  const userId = userData.user.id;
  const membership = await db.membership.findFirst({ where: { userId, deletedAt: null } });
  if (!membership) return null;
  const ctx = await DocumentAccessPolicy.resolveFacultyAccessContext(userId, membership.organizationId);
  return {
    userId,
    organizationId: membership.organizationId,
    departmentId: ctx.departmentId ?? null,
    collegeId: ctx.collegeId ?? null,
    userRole: ctx.userRole ?? "MEMBER",
  };
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getCtx(req);
    if (!ctx) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const { documentIds } = await req.json() as { documentIds?: string[] };
    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: "documentIds required" }, { status: 422 });
    }

    const result = await ResearchNotebookService.addDocumentsToNotebook(ctx, params.id, documentIds);
    return NextResponse.json(result, { status: 202 });
  } catch (err: any) {
    if (err.message === "RESEARCH_ACCESS_DENIED") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getCtx(req);
    if (!ctx) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const { documentId } = await req.json() as { documentId?: string };
    if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 422 });

    await ResearchNotebookService.removeDocumentFromNotebook(ctx, params.id, documentId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "RESEARCH_ACCESS_DENIED") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
