import { NextResponse } from "next/server";
import { FacultyService } from "@/server/services/faculty.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId") || "seed-org-001";
    const facultyId = searchParams.get("facultyId") || undefined;
    const dayOfWeek = searchParams.get("dayOfWeek") || undefined;
    const term = searchParams.get("term") || undefined;

    const timetables = await FacultyService.getTimetables(orgId, {
      facultyId,
      dayOfWeek,
      term,
    });

    return NextResponse.json({ success: true, timetables });
  } catch (error: any) {
    console.error("[API: /api/faculty/timetables GET] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch timetables" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.bulk && Array.isArray(body.entries)) {
      const orgId = body.organizationId || "seed-org-001";
      const created = await FacultyService.bulkImportTimetable(orgId, body.entries);
      return NextResponse.json({
        success: true,
        message: `Imported ${created.length} timetable entries successfully.`,
        created,
      });
    }

    const {
      organizationId = "seed-org-001",
      facultyId,
      courseCode,
      courseTitle,
      dayOfWeek,
      startTime,
      endTime,
      room,
      term,
      academicYear,
    } = body;

    if (!courseCode || !dayOfWeek || !startTime || !endTime || !room) {
      return NextResponse.json(
        { error: "Course code, day of week, start time, end time, and room are required." },
        { status: 400 }
      );
    }

    const entry = await FacultyService.createTimetableEntry({
      organizationId,
      facultyId,
      courseCode,
      courseTitle: courseTitle || courseCode,
      dayOfWeek,
      startTime,
      endTime,
      room,
      term,
      academicYear,
    });

    return NextResponse.json({ success: true, message: "Timetable slot added successfully", entry });
  } catch (error: any) {
    console.error("[API: /api/faculty/timetables POST] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create timetable slot" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await FacultyService.deleteTimetableEntry(id);
    return NextResponse.json({ success: true, message: "Timetable slot removed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete slot" }, { status: 500 });
  }
}
