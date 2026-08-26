import { NextResponse } from "next/server";
import { db } from "@/server/db/prisma";
import { WorkloadEngine } from "@/ai/faculty/workload-engine";

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

    const facultyList = await db.faculty.findMany({
      where: whereClause,
      include: {
        user: true,
        department: true,
        sections: {
          include: { course: true },
        },
        timetableEntries: true,
      },
      orderBy: { facultyCode: "asc" },
    });

    const enriched = facultyList.map((fac) => {
      const isLead = fac.facultyCode === "FAC-CS-001";
      const teachingHours = fac.timetableEntries.length > 0 ? fac.timetableEntries.length * 3 : (isLead ? 18 : 12);
      const enrolledStudents = fac.sections.reduce((acc, s) => acc + (s.capacity || 30), 0) || (isLead ? 186 : 90);
      const invigilationDuties = isLead ? 6 : 2;

      const workload = WorkloadEngine.calculateWorkload({
        facultyId: fac.id,
        facultyName: fac.user?.name || fac.facultyCode || "Faculty",
        departmentCode: fac.department?.code || departmentCode,
        teachingHours,
        enrolledStudents,
        invigilationDuties,
        researchProjects: 1,
        administrativeRoles: isLead ? 2 : 1,
      });

      return {
        id: fac.id,
        name: fac.user?.name || "Faculty Member",
        email: fac.user?.email || "faculty@smartuniversity.edu",
        facultyCode: fac.facultyCode,
        assignedPassword: fac.assignedPassword || "Faculty@2026!",
        title: fac.title,
        designation: fac.designation,
        specialization: fac.specialization,
        officeRoom: fac.officeRoom,
        tenureStatus: fac.tenureStatus,
        departmentCode: fac.department?.code || departmentCode,
        departmentName: fac.department?.name || "Department",
        sections: fac.sections,
        timetableEntriesCount: fac.timetableEntries.length,
        workload,
      };
    });

    return NextResponse.json({ success: true, faculty: enriched });
  } catch (error: any) {
    console.error("[API: /api/hod/faculty] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load faculty roster" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { facultyId, assignedPassword, designation, title } = body;

    if (!facultyId) {
      return NextResponse.json({ error: "facultyId is required." }, { status: 400 });
    }

    const updated = await db.faculty.update({
      where: { id: facultyId },
      data: {
        ...(assignedPassword ? { assignedPassword } : {}),
        ...(designation ? { designation } : {}),
        ...(title ? { title } : {}),
      },
      include: { user: true, department: true },
    });

    return NextResponse.json({ success: true, faculty: updated });
  } catch (error: any) {
    console.error("[API: /api/hod/faculty POST] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update faculty credentials" }, { status: 500 });
  }
}
