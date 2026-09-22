import { NextRequest, NextResponse } from "next/server";
import { PlacementService } from "@/server/services/placement.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeContent, targetDriveId, customJd } = body;

    if (!resumeContent || typeof resumeContent !== "string") {
      return NextResponse.json(
        { success: false, error: "Please provide resume content for ATS analysis." },
        { status: 400 }
      );
    }

    const result = await PlacementService.analyzeResumeATS(
      resumeContent,
      targetDriveId,
      customJd
    );

    return NextResponse.json({
      success: true,
      result,
      provenance: {
        source: "Demo University Dataset",
        datasetId: "deterministic-demo-v1",
        isDemo: true,
      },
    });
  } catch (error: any) {
    console.error("[API placement ATS] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to analyze resume" },
      { status: 500 }
    );
  }
}
