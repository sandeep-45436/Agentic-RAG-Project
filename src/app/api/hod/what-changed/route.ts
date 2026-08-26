import { NextResponse } from "next/server";
import { HODService } from "@/server/services/hod.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentCode = searchParams.get("department") || "CS";

    const deltas = await HODService.getWhatChangedIntelligence(departmentCode);
    return NextResponse.json({ success: true, deltas });
  } catch (error: any) {
    console.error("[API: /api/hod/what-changed] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch what changed deltas" }, { status: 500 });
  }
}
