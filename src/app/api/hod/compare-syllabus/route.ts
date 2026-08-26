import { NextResponse } from "next/server";
import { HODService } from "@/server/services/hod.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get("courseCode") || "CS401";
    const departmentCode = searchParams.get("department") || "CS";

    const diff = await HODService.compareSyllabus(courseCode, departmentCode);
    return NextResponse.json({ success: true, diff });
  } catch (error: any) {
    console.error("[API: /api/hod/compare-syllabus] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to compare syllabus" }, { status: 500 });
  }
}
