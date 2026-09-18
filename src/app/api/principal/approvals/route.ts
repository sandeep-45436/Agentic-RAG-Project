import { NextResponse } from "next/server";
import { PrincipalService } from "@/server/services/principal.service";

export async function GET() {
  try {
    const approvals = await PrincipalService.getExecutiveApprovals();
    return NextResponse.json({
      success: true,
      approvals,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load executive approvals" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await PrincipalService.resolveApproval(body.approvalId, body.action);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to resolve approval" },
      { status: 500 }
    );
  }
}
