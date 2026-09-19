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

async function resolveContext() {
  const insforge = await createClient();
  const { data: userData } = await insforge.auth.getCurrentUser();
  if (!userData?.user) return null;
  return ResearchNotebookService.resolveUserContext(userData.user.id);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (id.startsWith("ws-starter-")) {
      const { getStarterWorkspaceById } = await import("@/server/research/starter-workspaces");
      const { getProviderMeta } = await import("@/server/research/provider.factory");
      const starter = getStarterWorkspaceById(id);
      if (starter) {
        const providerMeta = getProviderMeta();
        return NextResponse.json({
          notebook: {
            id: starter.id,
            organizationId: starter.organizationId,
            title: starter.title,
            description: starter.description,
            provider: providerMeta.providerName,
            isDevelopmentMode: providerMeta.isDevelopmentMode,
            status: "ACTIVE",
            providerWebUrl: null,
            totalSources: starter.sources.length,
            staleSources: 0,
            createdAt: starter.createdAt,
            updatedAt: starter.updatedAt,
          },
          sources: starter.sources.map((s) => ({
            id: s.id,
            documentId: s.documentId,
            fileName: s.fileName,
            status: s.status,
            isStale: s.isStale,
            currentDocumentVersion: "1",
            syncedDocumentVersion: "1",
            errorMessage: s.errorMessage,
            updatedAt: s.updatedAt,
          })),
        });
      }
    }

    const ctx = await resolveContext();
    if (!ctx) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

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
    const ctx = await resolveContext();
    if (!ctx) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    await ResearchNotebookService.deleteNotebook(ctx, id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "RESEARCH_ACCESS_DENIED") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
