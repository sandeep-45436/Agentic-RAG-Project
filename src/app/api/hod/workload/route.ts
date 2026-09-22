import { NextRequest, NextResponse } from "next/server";
import { HODService } from "@/server/services/hod.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department") || "CSE";

    const workload = HODService.getDetailedFacultyWorkload(department);

    return NextResponse.json({
      success: true,
      workload,
    });
  } catch (error: any) {
    console.error("[API hod workload GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate faculty workload" },
      { status: 500 }
    );
  }
}
