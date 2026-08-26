import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    let organizationId: string = "seed-org-001";
    let userId: string | null = null;
    let studentRecord: any = null;
    let facultyRecord: any = null;

    // Check if faculty session is present
    const cookieStore = await cookies();
    const facultySession = cookieStore.get("faculty_session");
    if (facultySession?.value) {
      try {
        const parsed = JSON.parse(facultySession.value);
        if (parsed.organizationId) organizationId = parsed.organizationId;
        facultyRecord = parsed;
      } catch {}
    }

    // Check user session
    try {
      const insforge = await createClient();
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (userData?.user) {
        userId = userData.user.id;
        const membership = await db.membership.findFirst({
          where: { userId: userData.user.id },
        });
        if (membership?.organizationId) {
          organizationId = membership.organizationId;
        }

        studentRecord = await db.student.findFirst({
          where: {
            OR: [{ userId: userData.user.id }, { id: userData.user.id }],
            deletedAt: null,
          },
          include: {
            department: true,
          },
        });
      }
    } catch {}

    // Fetch all active departments in the organization
    let departments = await db.department.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        collegeId: true,
        _count: {
          select: {
            documents: { where: { deletedAt: null } },
            faculty: { where: { deletedAt: null } },
            courses: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { code: "asc" },
    });

    // If no departments exist yet in DB, create initial seed departments
    if (departments.length === 0) {
      const defaultDepts = [
        { code: "CSE", name: "Computer Science & Engineering", description: "Computing, Data Structures, AI & Algorithms" },
        { code: "ECE", name: "Electronics & Communication Engineering", description: "Digital Signal Processing, VLSI & Embedded Systems" },
        { code: "MECH", name: "Mechanical Engineering", description: "Thermodynamics, Robotics & Manufacturing" },
        { code: "EEE", name: "Electrical & Electronics Engineering", description: "Power Systems, Controls & Electrical Machines" },
        { code: "CIVIL", name: "Civil Engineering", description: "Structural Analysis & Environmental Engineering" },
        { code: "IT", name: "Information Technology", description: "Software Architecture, Cloud & Networks" },
      ];

      for (const dept of defaultDepts) {
        await db.department.create({
          data: {
            organizationId,
            code: dept.code,
            name: dept.name,
            description: dept.description,
          },
        });
      }

      departments = await db.department.findMany({
        where: { organizationId, deletedAt: null },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          collegeId: true,
          _count: {
            select: {
              documents: { where: { deletedAt: null } },
              faculty: { where: { deletedAt: null } },
              courses: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: { code: "asc" },
      });
    }

    const primaryDepartmentId = studentRecord?.departmentId || facultyRecord?.departmentId || departments[0]?.id;

    return NextResponse.json({
      success: true,
      departments,
      userScope: {
        userId,
        isStudent: Boolean(studentRecord),
        isFaculty: Boolean(facultyRecord),
        primaryDepartmentId,
        primaryDepartmentCode: studentRecord?.department?.code || facultyRecord?.departmentCode || departments[0]?.code,
        primaryDepartmentName: studentRecord?.department?.name || facultyRecord?.departmentName || departments[0]?.name,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/departments] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch departments" },
      { status: 500 }
    );
  }
}
