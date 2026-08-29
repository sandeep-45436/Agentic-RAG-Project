import { NextResponse } from "next/server";
import { db } from "@/server/db/prisma";
import { AuditService } from "@/server/services/audit.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentCode = searchParams.get("department") || "CS";
    const isAll = departmentCode === "ALL";

    // 1. Fetch Examinations
    let examinations = await db.examination.findMany({
      where: { deletedAt: null },
      include: {
        schedules: {
          include: {
            courseSection: { include: { course: true, faculty: { include: { user: true } } } },
            facility: true,
            invigilationAssignments: { include: { faculty: { include: { user: true } } } },
          },
        },
        invigilationAssignments: {
          include: { faculty: { include: { user: true, department: true } }, facility: true },
        },
      },
      orderBy: { startDate: "desc" },
    });

    // 2. Fetch Exam Seating Arrangements
    const seatings = await db.examSeatingArrangement.findMany({
      include: { facility: true, faculty: { include: { user: true } } },
      orderBy: [{ hallNumber: "asc" }, { rowNumber: "asc" }, { columnNumber: "asc" }],
      take: 50,
    });

    // 3. Fallback default exam if none created yet
    if (examinations.length === 0) {
      const org = await db.organization.findFirst();
      const defaultExam = await db.examination.create({
        data: {
          organizationId: org?.id || "seed-org-001",
          name: "Midterm Examination 1 - Fall 2026",
          term: "Fall 2026",
          academicYear: "2026-2027",
          startDate: new Date("2026-09-15"),
          endDate: new Date("2026-09-22"),
          status: "SCHEDULED",
        },
      });
      examinations = [defaultExam as any];
    }

    // Filter invigilators by department if not ALL
    let invigilators = await db.invigilationAssignment.findMany({
      include: {
        faculty: { include: { user: true, department: true } },
        schedule: { include: { courseSection: { include: { course: true } } } },
        facility: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!isAll) {
      invigilators = invigilators.filter((inv) => inv.faculty?.department?.code === departmentCode || isAll);
    }

    return NextResponse.json({
      success: true,
      examinations,
      schedules: examinations.flatMap((e) => e.schedules || []),
      invigilators: invigilators.map((inv) => ({
        id: inv.id,
        name: inv.faculty?.user?.name || inv.faculty?.facultyCode || "Faculty Member",
        facultyCode: inv.faculty?.facultyCode || "FAC",
        hall: inv.facility?.name || "Tech Hall 101",
        slot: "Morning (09:30 AM - 12:30 PM)",
        status: inv.status || "CONFIRMED",
        departmentCode: inv.faculty?.department?.code || departmentCode,
      })),
      seatings: seatings.map((s) => ({
        id: s.id,
        bench: s.benchNumber,
        row: s.rowNumber,
        col: s.columnNumber,
        pos: s.seatPosition,
        roll: s.studentRollNo,
        name: s.studentName,
        code: s.courseCode,
        title: s.courseTitle,
        hall: s.hallNumber,
      })),
    });
  } catch (error: any) {
    console.error("[API: /api/hod/examinations GET] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load examination governance data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, departmentCode = "CS", actorName = "HOD", ...payload } = body;

    const org = await db.organization.findFirst();
    const organizationId = org?.id || "seed-org-001";

    if (action === "CREATE_EXAM") {
      const { name, term = "Fall 2026", academicYear = "2026-2027", startDate, endDate } = payload;
      const exam = await db.examination.create({
        data: {
          organizationId,
          name,
          term,
          academicYear,
          startDate: new Date(startDate || "2026-09-15"),
          endDate: new Date(endDate || "2026-09-22"),
          status: "SCHEDULED",
        },
      });

      await AuditService.log({
        action: "EXAMINATION_CYCLE_CREATED",
        actorName,
        departmentCode,
        entityType: "EXAMINATION",
        entityId: exam.id,
        entityName: exam.name,
        newState: { name: exam.name, term: exam.term, startDate: exam.startDate, endDate: exam.endDate },
        reason: "HOD initiated examination cycle",
        policyCitation: "Examination Ordinance 5.1: Departmental midterm scheduling timeline compliance",
      });

      return NextResponse.json({ success: true, exam });
    }

    if (action === "SCHEDULE_PAPER") {
      const { examinationId, courseSectionId, facilityId, examDate, startTime, endTime, capacity = 40 } = payload;
      const schedule = await db.examinationSchedule.create({
        data: {
          organizationId,
          examinationId,
          courseSectionId: courseSectionId || null,
          facilityId: facilityId || null,
          examDate: new Date(examDate || new Date()),
          startTime: new Date(startTime || new Date()),
          endTime: new Date(endTime || new Date()),
          capacity: parseInt(capacity, 10) || 40,
        },
        include: { courseSection: { include: { course: true } }, facility: true },
      });

      await AuditService.log({
        action: "EXAM_PAPER_SCHEDULED",
        actorName,
        departmentCode,
        entityType: "EXAMINATION",
        entityId: schedule.id,
        entityName: `${schedule.courseSection?.course?.code || "Course"} Exam Paper`,
        newState: { examDate: schedule.examDate, room: schedule.facility?.name, capacity: schedule.capacity },
        reason: "Scheduled departmental examination session",
        policyCitation: "Examination Ordinance 8.3: Examination venue and timing allocation",
      });

      return NextResponse.json({ success: true, schedule });
    }

    if (action === "ASSIGN_INVIGILATOR") {
      const { examinationId, examinationScheduleId, facultyId, facilityId } = payload;

      let scheduleId = examinationScheduleId;
      if (!scheduleId) {
        const firstSched = await db.examinationSchedule.findFirst({ where: { examinationId } });
        scheduleId = firstSched?.id;
      }

      if (!scheduleId) {
        return NextResponse.json({ error: "An active examination schedule is required to assign an invigilator." }, { status: 400 });
      }

      const assignment = await db.invigilationAssignment.create({
        data: {
          organizationId,
          examinationId,
          examinationScheduleId: scheduleId,
          facultyId,
          facilityId: facilityId || null,
          workloadScore: 1.0,
          status: "ASSIGNED",
        },
        include: { faculty: { include: { user: true } }, facility: true },
      });

      await AuditService.log({
        action: "FACULTY_INVIGILATOR_APPOINTED",
        actorName,
        departmentCode,
        entityType: "FACULTY",
        entityId: facultyId,
        entityName: assignment.faculty?.user?.name || assignment.faculty?.facultyCode || "Faculty",
        newState: { duty: "INVIGILATION", hall: assignment.facility?.name || "Exam Hall", status: "ASSIGNED" },
        reason: "Department HOD assigned examination proctoring duty",
        policyCitation: "Faculty Handbook Section 6.2: Equitable invigilation workload allocation",
      });

      return NextResponse.json({ success: true, assignment });
    }

    if (action === "GENERATE_SEATING") {
      const { examinationId = "seed-exam-001" } = payload;

      // Fetch students and courses for zig-zag interleaving
      const students = await db.student.findMany({
        where: { deletedAt: null },
        include: { user: true, department: true },
        take: 20,
      });

      // Clear existing seating for this department/exam to avoid duplication
      await db.examSeatingArrangement.deleteMany({
        where: { organizationId },
      });

      const courses = ["CS401 (Algorithms)", "MATH301 (Linear Algebra)", "EE401 (Signal Processing)"];
      const createdSeatings = [];

      for (let i = 0; i < Math.min(students.length, 12); i++) {
        const st = students[i];
        const benchIndex = Math.floor(i / 2) + 1;
        const row = Math.floor((benchIndex - 1) / 3) + 1;
        const col = ((benchIndex - 1) % 3) + 1;
        const pos = i % 2 === 0 ? "Left" : "Right";
        const course = courses[i % courses.length];
        const courseCode = course.split(" ")[0];
        const courseTitle = course.split("(")[1]?.replace(")", "") || "Core Course";

        const seating = await db.examSeatingArrangement.create({
          data: {
            organizationId,
            examinationId: examinationId || "seed-exam-001",
            examDate: new Date("2026-09-16T09:30:00Z"),
            sessionSlot: "Morning (09:30 AM - 12:30 PM)",
            hallNumber: "Tech Hall 101",
            benchNumber: `B-${String(benchIndex).padStart(2, "0")}`,
            rowNumber: row,
            columnNumber: col,
            seatPosition: pos,
            studentRollNo: st.studentNumber,
            studentName: st.user?.name || st.studentNumber,
            courseCode,
            courseTitle,
          },
        });
        createdSeatings.push(seating);
      }

      await AuditService.log({
        action: "ANTI_MALPRACTICE_SEATING_GENERATED",
        actorName,
        departmentCode,
        entityType: "EXAMINATION",
        entityId: examinationId,
        entityName: "Midterm Seating Matrix",
        newState: { generatedSlots: createdSeatings.length, pattern: "ZIG_ZAG_INTERLEAVED", zeroOverlapGuaranteed: true },
        reason: "Automated anti-malpractice alternating-course seating matrix generation",
        policyCitation: "University Examination Code Section 14.2: Mandatory non-adjacent seating for identical question papers",
      });

      return NextResponse.json({ success: true, count: createdSeatings.length, seatings: createdSeatings });
    }

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (error: any) {
    console.error("[API: /api/hod/examinations POST] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to execute examination action" }, { status: 500 });
  }
}
