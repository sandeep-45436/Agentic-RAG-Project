import { NextResponse } from "next/server";
import { db } from "@/server/db/prisma";
import { AuditService } from "@/server/services/audit.service";

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
        lifecycleStatus: s.academicStatus,
        departmentCode: s.department?.code || departmentCode,
        departmentName: s.department?.name || "Department",
        advisorName: s.advisor?.user?.name || "Faculty Advisor",
        advisorId: s.advisorId,
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action = "ADMIT_STUDENT", departmentCode = "CS", actorName = "HOD", ...payload } = body;

    const org = await db.organization.findFirst();
    const organizationId = org?.id || "seed-org-001";

    if (action === "ADMIT_STUDENT") {
      const { name, email, studentNumber, major = "Computer Science", gpa = 3.5, academicStatus = "Good Standing" } = payload;

      if (!name || !email || !studentNumber) {
        return NextResponse.json({ error: "Name, email, and studentNumber are required." }, { status: 400 });
      }

      let dept = await db.department.findFirst({ where: { code: departmentCode } });
      if (!dept) dept = await db.department.findFirst();

      const user = await db.user.upsert({
        where: { email },
        update: { name },
        create: { email, name },
      });

      const faculty = await db.faculty.findFirst({ where: { departmentId: dept!.id } });

      const student = await db.student.create({
        data: {
          organizationId,
          userId: user.id,
          departmentId: dept!.id,
          advisorId: faculty?.id || null,
          studentNumber,
          major,
          gpa: parseFloat(gpa) || 3.5,
          academicStatus,
        },
        include: { user: true, department: true },
      });

      // Initialize default attendance & internal mark records
      await db.attendanceRecord.create({
        data: {
          organizationId,
          studentId: student.id,
          totalClasses: 40,
          attendedClasses: 36,
          percentage: 90.0,
        },
      });

      await db.internalMark.create({
        data: {
          organizationId,
          studentId: student.id,
          assessmentName: "Orientation Assessment",
          marksObtained: 85.0,
          maxMarks: 100.0,
          percentage: 85.0,
        },
      });

      await AuditService.log({
        action: "STUDENT_ADMITTED",
        actorName,
        departmentCode,
        entityType: "STUDENT",
        entityId: student.id,
        entityName: `${name} (${studentNumber})`,
        newState: { studentNumber, major, gpa, academicStatus: "Good Standing" },
        reason: "HOD approved student admission and departmental enrollment",
        policyCitation: "University Admissions Standard 1.2: Departmental cohort matriculation",
      });

      return NextResponse.json({ success: true, student });
    }

    if (action === "CONDONE_ATTENDANCE") {
      const { studentId, reason, evidenceDocument = "Medical Certificate / Academic Waiver", condonedPercentage = 75.0 } = payload;

      if (!studentId || !reason) {
        return NextResponse.json({ error: "studentId and reason are required for attendance condonation." }, { status: 400 });
      }

      const student = await db.student.findUnique({
        where: { id: studentId },
        include: { user: true, attendanceRecords: true },
      });

      if (!student) {
        return NextResponse.json({ error: "Student not found." }, { status: 404 });
      }

      let att = student.attendanceRecords[0];
      const prevPercentage = att?.percentage || 60.0;
      const targetPct = Math.max(parseFloat(condonedPercentage) || 75.0, prevPercentage);
      const newAttended = Math.round((targetPct / 100) * (att?.totalClasses || 40));

      if (att) {
        await db.attendanceRecord.update({
          where: { id: att.id },
          data: { percentage: targetPct, attendedClasses: newAttended },
        });
      } else {
        await db.attendanceRecord.create({
          data: {
            organizationId,
            studentId: student.id,
            totalClasses: 40,
            attendedClasses: newAttended,
            percentage: targetPct,
          },
        });
      }

      await AuditService.log({
        action: "ATTENDANCE_CONDONATION_EXECUTED",
        actorName,
        departmentCode,
        entityType: "CONDONATION",
        entityId: student.id,
        entityName: `${student.user?.name || student.studentNumber} (${student.studentNumber})`,
        previousState: { attendancePercentage: prevPercentage, eligibleForExams: prevPercentage >= 75 },
        newState: { attendancePercentage: targetPct, eligibleForExams: true, evidence: evidenceDocument },
        reason,
        policyCitation: "Examination Ordinance 12.3: Formal HOD condonation for certified medical circumstances",
      });

      return NextResponse.json({
        success: true,
        message: `Attendance condonation granted for ${student.user?.name || student.studentNumber}. Exam hall ticket unblocked.`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API: /api/hod/students POST] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process student action" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { studentId, major, academicStatus, advisorId, reason = "Student academic status governance update", departmentCode = "CS", actorName = "HOD" } = body;

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required." }, { status: 400 });
    }

    const prev = await db.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!prev) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    const updated = await db.student.update({
      where: { id: studentId },
      data: {
        ...(major ? { major } : {}),
        ...(academicStatus ? { academicStatus } : {}),
        ...(advisorId ? { advisorId } : {}),
      },
      include: { user: true, department: true },
    });

    await AuditService.log({
      action: "STUDENT_STATUS_UPDATED",
      actorName,
      departmentCode,
      entityType: "STUDENT",
      entityId: updated.id,
      entityName: `${updated.user?.name || updated.studentNumber}`,
      previousState: { academicStatus: prev.academicStatus, major: prev.major },
      newState: { academicStatus: updated.academicStatus, major: updated.major },
      reason,
      policyCitation: "Academic Regulation 2.5: Student lifecycle standing classification",
    });

    return NextResponse.json({ success: true, student: updated });
  } catch (error: any) {
    console.error("[API: /api/hod/students PUT] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update student standing" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const reason = searchParams.get("reason") || "Student withdrawal / institutional transfer";
    const departmentCode = searchParams.get("department") || "CS";
    const actorName = searchParams.get("actorName") || "HOD";

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required." }, { status: 400 });
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    // Safe lifecycle transition to WITHDRAWN (no hard delete)
    const updated = await db.student.update({
      where: { id: studentId },
      data: { academicStatus: "Withdrawn" },
    });

    await AuditService.log({
      action: "STUDENT_WITHDRAWN",
      actorName,
      departmentCode,
      entityType: "STUDENT",
      entityId: student.id,
      entityName: `${student.user?.name || student.studentNumber}`,
      previousState: { academicStatus: student.academicStatus },
      newState: { academicStatus: "Withdrawn", active: false },
      reason,
      policyCitation: "Academic Regulation 9.1: Student de-registration protocol",
    });

    return NextResponse.json({
      success: true,
      message: `Student ${student.user?.name || student.studentNumber} transitioned to Withdrawn status with full audit logging.`,
      student: updated,
    });
  } catch (error: any) {
    console.error("[API: /api/hod/students DELETE] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to deregister student" }, { status: 500 });
  }
}
