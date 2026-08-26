import { NextResponse } from "next/server";
import { HODService } from "@/server/services/hod.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentCode = searchParams.get("department") || "CS";

    const proposals = await HODService.getActionProposals(departmentCode);
    return NextResponse.json({ success: true, proposals });
  } catch (error: any) {
    console.error("[API: /api/hod/proposals GET] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch proposals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proposalId, action, confirmedBy = "HOD" } = body;

    if (!proposalId || !action) {
      return NextResponse.json({ error: "proposalId and action ('APPROVE' | 'REJECT' | 'ESCALATE') are required." }, { status: 400 });
    }

    const result = await HODService.resolveActionProposal(proposalId, action, confirmedBy);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API: /api/hod/proposals POST] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to resolve proposal" }, { status: 500 });
  }
}
