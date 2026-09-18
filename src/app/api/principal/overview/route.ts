import { NextResponse } from "next/server";
import { PrincipalService } from "@/server/services/principal.service";

export async function GET() {
  try {
    const overview = await PrincipalService.getOverviewMetrics();
    return NextResponse.json({
      success: true,
      overview,
    });
  } catch (error: any) {
    console.error("[API principal overview] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load principal overview" },
      { status: 500 }
    );
  }
}
