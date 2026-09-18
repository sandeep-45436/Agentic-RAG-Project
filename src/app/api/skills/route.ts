import { NextResponse } from "next/server";
import { SkillsService } from "@/server/services/skills.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetRole = searchParams.get("role") || "Principal AI / Cloud Architect";
    const studentId = searchParams.get("studentId") || undefined;

    const [tracks, profile, roadmap] = await Promise.all([
      SkillsService.getSkillTracks(),
      SkillsService.getStudentSkillProfile(studentId),
      SkillsService.getCareerRoadmap(targetRole),
    ]);

    return NextResponse.json({
      success: true,
      tracks,
      profile,
      roadmap,
    });
  } catch (error: any) {
    console.error("[API skills] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load skills data" },
      { status: 500 }
    );
  }
}
