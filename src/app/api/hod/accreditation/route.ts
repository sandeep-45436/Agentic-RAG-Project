import { NextRequest, NextResponse } from "next/server";
import { HODService } from "@/server/services/hod.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department") || "CSE";

    const audit = HODService.getNBAAttainmentAudit(department);

    return NextResponse.json({
      success: true,
      audit,
    });
  } catch (error: any) {
    console.error("[API hod accreditation GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate NBA attainment audit" },
      { status: 500 }
    );
  }
}
