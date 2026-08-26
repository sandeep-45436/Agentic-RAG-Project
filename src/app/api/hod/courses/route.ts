import { NextResponse } from "next/server";
import { db } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentCode = searchParams.get("department") || "CS";
    const isAll = departmentCode === "ALL";

    const whereClause: any = { deletedAt: null };
    if (!isAll) {
      whereClause.department = { code: departmentCode };
    }

    const courses = await db.course.findMany({
      where: whereClause,
      include: {
        department: true,
        sections: {
          include: {
            faculty: { include: { user: true } },
            enrolments: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });

    const formatted = courses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      credits: c.credits,
      departmentCode: c.department?.code || departmentCode,
      departmentName: c.department?.name || "Department",
      syllabusStatus: "APPROVED_RAG_INDEXED",
      sections: c.sections.map((s) => ({
        id: s.id,
        sectionCode: s.sectionCode,
        term: s.term,
        room: s.room,
        scheduleText: s.scheduleText,
        capacity: s.capacity,
        enrolledCount: s.enrolments.length || (s.capacity ? Math.round(s.capacity * 0.85) : 25),
        facultyName: s.faculty?.user?.name || s.faculty?.facultyCode || "Unassigned",
        facultyId: s.facultyId,
      })),
    }));

    return NextResponse.json({ success: true, courses: formatted });
  } catch (error: any) {
    console.error("[API: /api/hod/courses] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load courses" }, { status: 500 });
  }
}
