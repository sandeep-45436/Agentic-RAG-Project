import { NextResponse } from "next/server";
import { db } from "@/server/db/prisma";
import { AuditService } from "@/server/services/audit.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentCode = searchParams.get("department") || "CS";

    const entries = await db.timetableEntry.findMany({
      include: {
        faculty: {
          include: {
            user: true,
            department: true,
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    const isAll = departmentCode === "ALL";
    const filtered = isAll
      ? entries
      : entries.filter((e) => {
          if (e.faculty?.department?.code) return e.faculty.department.code === departmentCode;
          if (departmentCode === "CS" && (e.courseCode.startsWith("CS") || e.courseCode.startsWith("CSE"))) return true;
          if (departmentCode === "MATH" && e.courseCode.startsWith("MATH")) return true;
          if (departmentCode === "EE" && e.courseCode.startsWith("EE")) return true;
          return false;
        });

    return NextResponse.json({ success: true, timetables: filtered });
  } catch (error: any) {
    console.error("[API: /api/hod/timetables] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load master timetable" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courseCode, courseTitle, dayOfWeek, startTime, endTime, room, facultyId, departmentCode = "CS", actorName = "HOD" } = body;

    if (!courseCode || !dayOfWeek || !startTime || !endTime || !room) {
      return NextResponse.json({ error: "courseCode, dayOfWeek, startTime, endTime, and room are required." }, { status: 400 });
    }

    const org = await db.organization.findFirst();
    const organizationId = org?.id || "seed-org-001";

    // 1. Conflict Check: check if room is already occupied at this day & time
    const existingRoomSlot = await db.timetableEntry.findFirst({
      where: {
        dayOfWeek,
        startTime,
        room,
      },
    });

    let warningMessage = null;
    if (existingRoomSlot) {
      warningMessage = `Potential Room Collision Detected: ${room} is already booked for ${existingRoomSlot.courseCode} at ${startTime} on ${dayOfWeek}.`;
    }

    const entry = await db.timetableEntry.create({
      data: {
        organizationId,
        courseCode,
        courseTitle: courseTitle || "Curriculum Course",
        dayOfWeek,
        startTime,
        endTime,
        room,
        facultyId: facultyId || null,
        term: "Fall 2026",
        academicYear: "2026-2027",
      },
      include: { faculty: { include: { user: true } } },
    });

    await AuditService.log({
      action: "TIMETABLE_SLOT_CREATED",
      actorName,
      departmentCode,
      entityType: "TIMETABLE",
      entityId: entry.id,
      entityName: `${courseCode} (${dayOfWeek} ${startTime})`,
      newState: { day: dayOfWeek, time: `${startTime} - ${endTime}`, room, faculty: entry.faculty?.user?.name || "Unassigned" },
      reason: "HOD added weekly lecture slot to department master timetable",
      policyCitation: "University Scheduling Ordinance 3.1: Weekly lecture and room allocation standard",
    });

    return NextResponse.json({ success: true, timetable: entry, warning: warningMessage });
  } catch (error: any) {
    console.error("[API: /api/hod/timetables POST] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create timetable slot" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { slotId, dayOfWeek, startTime, endTime, room, facultyId, departmentCode = "CS", actorName = "HOD", reason = "Lecture schedule adjustment" } = body;

    if (!slotId) {
      return NextResponse.json({ error: "slotId is required." }, { status: 400 });
    }

    const prev = await db.timetableEntry.findUnique({ where: { id: slotId } });

    const updated = await db.timetableEntry.update({
      where: { id: slotId },
      data: {
        ...(dayOfWeek ? { dayOfWeek } : {}),
        ...(startTime ? { startTime } : {}),
        ...(endTime ? { endTime } : {}),
        ...(room ? { room } : {}),
        ...(facultyId !== undefined ? { facultyId: facultyId || null } : {}),
      },
      include: { faculty: { include: { user: true } } },
    });

    await AuditService.log({
      action: "TIMETABLE_SLOT_UPDATED",
      actorName,
      departmentCode,
      entityType: "TIMETABLE",
      entityId: updated.id,
      entityName: `${updated.courseCode} (${updated.dayOfWeek})`,
      previousState: prev ? { day: prev.dayOfWeek, time: `${prev.startTime}-${prev.endTime}`, room: prev.room } : null,
      newState: { day: updated.dayOfWeek, time: `${updated.startTime}-${updated.endTime}`, room: updated.room },
      reason,
      policyCitation: "Scheduling Ordinance 4.0",
    });

    return NextResponse.json({ success: true, timetable: updated });
  } catch (error: any) {
    console.error("[API: /api/hod/timetables PUT] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update timetable slot" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get("slotId");
    const departmentCode = searchParams.get("department") || "CS";
    const actorName = searchParams.get("actorName") || "HOD";

    if (!slotId) {
      return NextResponse.json({ error: "slotId is required." }, { status: 400 });
    }

    const entry = await db.timetableEntry.findUnique({ where: { id: slotId } });
    if (!entry) {
      return NextResponse.json({ error: "Timetable slot not found." }, { status: 404 });
    }

    await db.timetableEntry.delete({ where: { id: slotId } });

    await AuditService.log({
      action: "TIMETABLE_SLOT_REMOVED",
      actorName,
      departmentCode,
      entityType: "TIMETABLE",
      entityId: slotId,
      entityName: `${entry.courseCode} (${entry.dayOfWeek} ${entry.startTime})`,
      previousState: { day: entry.dayOfWeek, time: entry.startTime, room: entry.room },
      newState: { deleted: true },
      reason: "HOD removed weekly lecture slot",
      policyCitation: "Scheduling Ordinance 4.3",
    });

    return NextResponse.json({ success: true, message: `Timetable slot for ${entry.courseCode} removed.` });
  } catch (error: any) {
    console.error("[API: /api/hod/timetables DELETE] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete timetable slot" }, { status: 500 });
  }
}
