import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { BatchEvaluationService } from "@/server/services/batch-evaluation.service";

export const dynamic = "force-dynamic";

/** GET /api/eval/runs — list all runs for the authenticated org */
export async function GET() {
  try {
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    if (!userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await db.membership.findFirst({
      where: { userId: userData.user.id, deletedAt: null },
    });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 403 });

    const runs = await BatchEvaluationService.listRuns(membership.organizationId);
    return NextResponse.json({ runs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** POST /api/eval/runs — trigger a new batch evaluation run */
export async function POST() {
  try {
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    if (!userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await db.membership.findFirst({
      where: { userId: userData.user.id, deletedAt: null },
    });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 403 });

    // Check question count first
    let questionCount = await db.evalQuestion.count({
      where: { organizationId: membership.organizationId },
    });
    if (questionCount === 0) {
      const benchmarkQuestions = await db.evalQuestion.findMany({
        where: { organizationId: "seed-org-001" },
      });
      if (benchmarkQuestions.length > 0) {
        await db.evalQuestion.createMany({
          data: benchmarkQuestions.map((q) => ({
            organizationId: membership.organizationId,
            question: q.question,
            expectedAnswer: q.expectedAnswer,
            relevantCategories: q.relevantCategories,
            intentCategory: q.intentCategory,
            difficulty: q.difficulty,
          })),
        });
        questionCount = benchmarkQuestions.length;
      } else {
        return NextResponse.json(
          { error: "No evaluation questions found. Run `npx tsx scripts/seed-eval-dataset.ts` first." },
          { status: 400 }
        );
      }
    }

    const evalRunId = await BatchEvaluationService.triggerRun(membership.organizationId);
    return NextResponse.json({ evalRunId, questionCount }, { status: 202 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
