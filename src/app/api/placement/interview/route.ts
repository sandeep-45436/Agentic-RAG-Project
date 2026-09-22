import { NextRequest, NextResponse } from "next/server";
import { PlacementService } from "@/server/services/placement.service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const questions = PlacementService.getMockInterviewQuestions();
    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error: any) {
    console.error("[API placement interview GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load interview questions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, answer } = body;

    if (!questionId || !answer) {
      return NextResponse.json(
        { success: false, error: "Both questionId and answer are required." },
        { status: 400 }
      );
    }

    const evaluation = PlacementService.evaluateMockInterviewAnswer(questionId, answer);

    return NextResponse.json({
      success: true,
      evaluation,
      provenance: {
        source: "Demo University Dataset",
        datasetId: "deterministic-demo-v1",
        isDemo: true,
      },
    });
  } catch (error: any) {
    console.error("[API placement interview POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to evaluate interview answer" },
      { status: 500 }
    );
  }
}
