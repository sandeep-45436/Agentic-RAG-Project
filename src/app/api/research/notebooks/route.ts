/**
 * POST /api/research/notebooks  — create a new research notebook
 * GET  /api/research/notebooks  — list notebooks accessible to the authenticated user
 */
import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { DocumentAccessPolicy } from "@/server/services/document-access-policy";
import { ResearchNotebookService } from "@/server/services/research-notebook.service";
import { getProviderMeta } from "@/server/research/provider.factory";

export const dynamic = "force-dynamic";

async function resolveContext() {
  const insforge = await createClient();
  const { data: userData } = await insforge.auth.getCurrentUser();
  if (!userData?.user) return null;
  return ResearchNotebookService.resolveUserContext(userData.user.id);
}

export async function GET() {
  try {
    const ctx = await resolveContext();
    if (!ctx) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const notebooks = await ResearchNotebookService.getAuthorizedNotebooks(ctx);
    const providerMeta = getProviderMeta();

    return NextResponse.json({ notebooks, provider: providerMeta });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await resolveContext();
    if (!ctx) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const body = await req.json();
    const { title, description, documentIds } = body as {
      title?: string;
      description?: string;
      documentIds?: string[];
    };

    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 422 });
    }
    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: "documentIds must be a non-empty array" }, { status: 422 });
    }
    // organizationId / departmentId are NEVER read from body — always from ctx

    const notebook = await ResearchNotebookService.createResearchNotebook(
      ctx,
      title.trim(),
      description,
      documentIds
    );

    return NextResponse.json({ notebook }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
