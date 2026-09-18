import { NextResponse } from "next/server";
import { SkillsService } from "@/server/services/skills.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trackId = searchParams.get("trackId") || undefined;

    const questions = await SkillsService.getAssessmentQuestions(trackId);
    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load questions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await SkillsService.submitAssessment({
      questionId: body.questionId,
      selectedOptionIndex: body.selectedOptionIndex,
      codeAnswer: body.codeAnswer,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit assessment" },
      { status: 500 }
    );
  }
}
