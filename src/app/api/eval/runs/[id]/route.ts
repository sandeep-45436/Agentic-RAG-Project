import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { BatchEvaluationService } from "@/server/services/batch-evaluation.service";

export const dynamic = "force-dynamic";

/** GET /api/eval/runs/[id] — per-question breakdown and live progress for a specific run */
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

    const results = await BatchEvaluationService.getRunDetails(id);
    return NextResponse.json({
      run,
      results,
      completedCount: results.length,
      totalQuestions: run.totalQuestions || results.length,
      isCompleted: run.status === "COMPLETED",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** POST /api/eval/runs/[id] — process next batch of questions for this run */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    if (!userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const run = await db.evalRun.findUnique({ where: { id } });
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is acceptable
    }

    const { questionIds, batchSize } = body;

    const progress = await BatchEvaluationService.evaluateQuestionsBatch(
      id,
      run.organizationId,
      questionIds,
      batchSize || 3
    );

    return NextResponse.json(progress);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** DELETE /api/eval/runs/[id] — cancel or stop this evaluation run */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    if (!userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await BatchEvaluationService.cancelRun(id);

    return NextResponse.json({ success: true, message: "Run stopped by user" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
