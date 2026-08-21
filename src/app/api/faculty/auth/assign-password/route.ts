import { NextResponse } from "next/server";
import { FacultyService } from "@/server/services/faculty.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId") || "seed-org-001";
    const facultyList = await FacultyService.listAllFaculty(orgId);
    return NextResponse.json({ success: true, faculty: facultyList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to list faculty" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { facultyId, facultyCode, assignedPassword, designation, specialization } = body;

    if (!facultyId || !assignedPassword) {
      return NextResponse.json(
        { error: "facultyId and assignedPassword are required." },
        { status: 400 }
      );
    }

    const updated = await FacultyService.assignFacultyCredentials(facultyId, {
      facultyCode,
      assignedPassword,
      designation,
      specialization,
    });

    return NextResponse.json({
      success: true,
      message: "Faculty credentials updated successfully",
      faculty: updated,
    });
  } catch (error: any) {
    console.error("[API: /api/faculty/auth/assign-password] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to assign credentials" },
      { status: 500 }
    );
  }
}
