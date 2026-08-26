import { NextResponse } from "next/server";
import { db } from "@/server/db/prisma";

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
