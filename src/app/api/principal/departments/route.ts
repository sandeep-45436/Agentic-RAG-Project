import { NextResponse } from "next/server";
import { PrincipalService } from "@/server/services/principal.service";

export async function GET() {
  try {
    const departments = await PrincipalService.getDepartmentBenchmarks();
    return NextResponse.json({
      success: true,
      departments,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load department benchmarks" },
      { status: 500 }
    );
  }
}
