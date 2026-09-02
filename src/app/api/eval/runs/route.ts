import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { BatchEvaluationService } from "@/server/services/batch-evaluation.service";

export const dynamic = "force-dynamic";

/** GET /api/eval/runs — list all runs with auto-healing and live counts */
export async function GET() {
  try {
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    if (!userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = await BatchEvaluationService.resolveOrganization(userData.user.id);
    const runs = await BatchEvaluationService.listRuns(organizationId);

    return NextResponse.json({ runs, organizationId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** POST /api/eval/runs — initialize a new evaluation run with interactive preset options */
export async function POST(req: Request) {
  try {
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    if (!userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = await BatchEvaluationService.resolveOrganization(userData.user.id);

    let options: any = {};
    try {
      options = await req.json();
    } catch {
      // Empty body is fine — default options
    }

    const runInfo = await BatchEvaluationService.createRun(organizationId, options);

    return NextResponse.json(
      {
        evalRunId: runInfo.runId,
        totalQuestions: runInfo.totalQuestions,
        questionIds: runInfo.questionIds,
        organizationId,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** DELETE /api/eval/runs — clean up / abort all currently running runs */
export async function DELETE() {
  try {
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    if (!userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = await BatchEvaluationService.resolveOrganization(userData.user.id);
    await BatchEvaluationService.cleanStaleRuns(organizationId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
