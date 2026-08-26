import { NextResponse } from "next/server";
import { db } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentCode = searchParams.get("department") || "CS";
    const filter = searchParams.get("filter") || "ALL"; // ALL, AT_RISK, PROBATION, ATTENDANCE_SHORTFALL
    const isAll = departmentCode === "ALL";

    const whereClause: any = { deletedAt: null };
    if (!isAll) {
      whereClause.department = { code: departmentCode };
    }

    const students = await db.student.findMany({
      where: whereClause,
      include: {
        user: true,
        department: true,
        advisor: { include: { user: true } },
        attendanceRecords: true,
        internalMarks: true,
        financialAccounts: true,
        hostelRecord: true,
        scholarshipRecord: true,
      },
      orderBy: { studentNumber: "asc" },
    });

    let formatted = students.map((s) => {
      const att = s.attendanceRecords[0] || { attendedClasses: 28, totalClasses: 40, percentage: 70.0 };
      const internal = s.internalMarks[0] || { marksObtained: 60, maxMarks: 100, percentage: 60.0 };
      const finance = s.financialAccounts[0] || { balanceOutstanding: 0, status: "Paid" };

      const isProbation = s.academicStatus === "Academic Probation" || s.gpa < 2.0;
      const isAttendanceRisk = att.percentage < 75.0;
      const isFeeHold = finance.status === "Overdue" || finance.balanceOutstanding > 1000;

      let riskLevel: "CRITICAL" | "HIGH" | "MODERATE" | "LOW" = "LOW";
      if (isProbation && isAttendanceRisk) riskLevel = "CRITICAL";
      else if (isProbation || isAttendanceRisk) riskLevel = "HIGH";
      else if (isFeeHold) riskLevel = "MODERATE";

      return {
        id: s.id,
        studentNumber: s.studentNumber,
        name: s.user?.name || "Student Name",
        email: s.user?.email || "student@smartuniversity.edu",
        major: s.major,
        gpa: s.gpa,
        academicStatus: s.academicStatus,
        departmentCode: s.department?.code || departmentCode,
        departmentName: s.department?.name || "Department",
        advisorName: s.advisor?.user?.name || "Faculty Advisor",
        attendancePercentage: att.percentage,
        attendedClasses: att.attendedClasses,
        totalClasses: att.totalClasses,
        internalMarks: internal.marksObtained,
        maxInternalMarks: internal.maxMarks,
        balanceOutstanding: finance.balanceOutstanding,
        feeStatus: finance.status,
        hostelName: s.hostelRecord?.hostelName || "Campus Day Scholar",
        scholarshipName: s.scholarshipRecord?.scholarshipName || "N/A",
        scholarshipStatus: s.scholarshipRecord?.status || "None",
        riskLevel,
        isProbation,
        isAttendanceRisk,
        isFeeHold,
      };
    });

    if (filter === "PROBATION") {
      formatted = formatted.filter((s) => s.isProbation);
    } else if (filter === "ATTENDANCE_SHORTFALL") {
      formatted = formatted.filter((s) => s.isAttendanceRisk);
    } else if (filter === "AT_RISK") {
      formatted = formatted.filter((s) => s.riskLevel === "CRITICAL" || s.riskLevel === "HIGH");
    }

    return NextResponse.json({ success: true, students: formatted });
  } catch (error: any) {
    console.error("[API: /api/hod/students] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch student roster" }, { status: 500 });
  }
}
