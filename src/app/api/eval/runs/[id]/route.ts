import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { BatchEvaluationService } from "@/server/services/batch-evaluation.service";

export const dynamic = "force-dynamic";

/** GET /api/eval/runs/[id] — per-question breakdown for a specific run */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    if (!userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const run = await db.evalRun.findUnique({ where: { id } });
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

    const membership = await db.membership.findFirst({
      where: { userId: userData.user.id, organizationId: run.organizationId, deletedAt: null },
    });
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const results = await BatchEvaluationService.getRunDetails(id);
    return NextResponse.json({ run, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
