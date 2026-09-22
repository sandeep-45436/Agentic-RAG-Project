import { NextRequest, NextResponse } from "next/server";
import { FacultyService } from "@/server/services/faculty.service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get("courseCode") || "CSE401";
    const date = searchParams.get("date") || undefined;

    const data = await FacultyService.getClassAttendance(courseCode, date);

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error("[API faculty attendance GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load class attendance register" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseCode = "CSE401", updates = [] } = body;

    const result = await FacultyService.recordAttendance(courseCode, updates);

    return NextResponse.json({
      ...result,
      provenance: {
        source: "ALITS Academic SIS Simulation",
        datasetId: "academic-demo-v1",
        mode: "Faculty Operations Sandbox",
        isDemo: true,
      },
    });
  } catch (error: any) {
    console.error("[API faculty attendance POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record attendance" },
      { status: 500 }
    );
  }
}
