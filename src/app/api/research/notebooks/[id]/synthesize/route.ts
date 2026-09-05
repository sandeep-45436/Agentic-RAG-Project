/** POST /api/research/notebooks/:id/synthesize — multi-document synthesis via Gemini */
import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { DocumentAccessPolicy } from "@/server/services/document-access-policy";
import { ResearchNotebookService } from "@/server/services/research-notebook.service";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    if (!userData?.user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    const ctx = await ResearchNotebookService.resolveUserContext(userData.user.id);
    if (!ctx) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const mode = body.mode ?? "summary";
    const customPrompt = body.prompt;

    const result = await ResearchNotebookService.synthesizeNotebook(
      ctx,
      id,
      mode,
      customPrompt
    );

    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (err: any) {
    if (err.message === "RESEARCH_ACCESS_DENIED") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
