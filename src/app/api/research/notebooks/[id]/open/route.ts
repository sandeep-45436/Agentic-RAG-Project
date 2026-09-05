/** GET /api/research/notebooks/:id/open — get provider web URL to open the workspace */
import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { DocumentAccessPolicy } from "@/server/services/document-access-policy";
import { ResearchNotebookService } from "@/server/services/research-notebook.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    if (!userData?.user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    const ctx = await ResearchNotebookService.resolveUserContext(userData.user.id);
    if (!ctx) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const webUrl = await ResearchNotebookService.getNotebookWebUrl(ctx, id);
    if (!webUrl) {
      return NextResponse.json({ error: "No workspace URL available yet" }, { status: 404 });
    }
    return NextResponse.json({ webUrl });
  } catch (err: any) {
    if (err.message === "NOTEBOOK_NOT_FOUND") return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (err.message === "RESEARCH_ACCESS_DENIED") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
