import { z } from "zod";
import { db } from "@/server/db/prisma";
import { StudentRepository } from "@/server/repositories/student.repository";
import { FacultyRepository } from "@/server/repositories/faculty.repository";
import { CourseRepository } from "@/server/repositories/course.repository";
import { FinancialRepository } from "@/server/repositories/financial.repository";
import { StudentOperationsService } from "@/server/services/student-operations.service";
import { AcademicAnalyticsRepository } from "@/server/repositories/academic-analytics.repository";
import { ExaminationRepository } from "@/server/repositories/examination.repository";
import { ExaminationAnalyticsRepository } from "@/server/repositories/examination-analytics.repository";
import { HallTicketEngine } from "@/ai/examination/hall-ticket-engine";
import { ExaminationSchedulingEngine, ScheduleItem } from "@/ai/examination/examination-scheduling-engine";
import { InvigilationEngine, FacultyCandidate } from "@/ai/examination/invigilation-engine";
import { FacultyService } from "@/server/services/faculty.service";

export const UniversityDatabaseToolSchema = z.object({
  operation: z.enum([
    "probation_students",
    "financial_ledger",
    "faculty_workload",
    "course_catalog",
    "student_list",
    "exam_eligibility",
    "hall_ticket_status",
    "exam_schedule",
    "exam_conflicts",
    "invigilation_analysis",
    "exam_results",
    "exam_analytics",
    "course_difficulty_index",
    "course_performance",
    "department_analytics",
    "semester_results",
  ]),
  organizationId: z.string().min(1, "Organization ID is required"),
  gpaThreshold: z.number().optional().default(2.0),
  limit: z.number().optional().default(10),
  departmentCode: z.string().optional(),
  examinationId: z.string().optional(),
  studentId: z.string().optional(),
});

export type UniversityDatabaseToolInput = z.infer<typeof UniversityDatabaseToolSchema>;

export class UniversityDatabaseTool {
  static readonly toolName = "university_database_query";
  static readonly description = "Queries structured relational data for university operations: student academic standing, examination eligibility, hall ticket status, exam schedules, invigilation workloads, tuition balances, and analytics.";
  static readonly schema = UniversityDatabaseToolSchema;

  static async execute(input: UniversityDatabaseToolInput) {
    const validated = UniversityDatabaseToolSchema.parse(input);
    const { operation, organizationId, gpaThreshold, limit, departmentCode, examinationId, studentId } = validated;

    try {
      switch (operation) {
        case "exam_analytics":
        case "course_difficulty_index": {
          const metrics = await ExaminationAnalyticsRepository.getCourseDifficultyIndex(organizationId);
          return {
            success: true,
            operation,
            records: metrics,
          };
        }

        case "exam_eligibility": {
          if (examinationId) {
            const list = await ExaminationRepository.getEligibilityRoster(examinationId, organizationId);
            if (list.length > 0) {
              return { success: true, operation, records: list };
            }
          }
          const records = await StudentOperationsService.getExamIneligibleStudents(organizationId);
          return {
            success: true,
            operation,
            records,
          };
        }

        case "hall_ticket_status": {
          if (studentId) {
            const student = await StudentOperationsService.getStudentFullProfile(studentId, organizationId);
            if (student) {
              const totalAttendance = student.attendanceRecords.length > 0
                ? student.attendanceRecords.reduce((acc, a) => acc + (a.percentage || 0), 0) / student.attendanceRecords.length
                : 82.5;
              const totalDue = student.financialAccounts.reduce((acc, f) => acc + f.balanceOutstanding, 0);

              const decision = HallTicketEngine.evaluateEligibility(
                {
                  studentId: student.id,
                  studentNumber: student.studentNumber,
                  name: student.user?.name || "Student",
                  academicStatus: student.academicStatus,
                  attendancePercentage: totalAttendance,
                  outstandingBalance: totalDue,
                  internalMarksComplete: student.internalMarks.length > 0,
                },
                examinationId || "exam-fall-2026"
              );
              return {
                success: true,
                operation,
                records: [decision],
              };
            }
          }

          // Fallback roster
          const roster = await ExaminationRepository.getEligibilityRoster(examinationId || "seed-exam-001", organizationId);
          return {
            success: true,
            operation,
            records: roster,
          };
        }

        case "exam_schedule": {
          const exams = await ExaminationRepository.listExaminations(organizationId);
          const schedules = await db.examinationSchedule.findMany({
            where: {
              ...(examinationId ? { examinationId } : {}),
              examination: { organizationId },
            },
            include: {
              courseSection: { include: { course: true } },
              facility: true,
              examination: true,
            },
            take: limit || 20,
          });

          return {
            success: true,
            operation,
            examinations: exams,
            records: schedules.map((s) => ({
              scheduleId: s.id,
              examName: s.examination?.name || "Term Exam",
              courseCode: s.courseSection?.course?.code || "COURSE",
              courseTitle: s.courseSection?.course?.title || "Subject",
              examDate: s.examDate,
              startTime: s.startTime,
              endTime: s.endTime,
              room: s.facility?.roomNumber || "Main Hall",
              capacity: s.facility?.capacity || 60,
            })),
          };
        }

        case "exam_conflicts": {
          const rawSchedules = await db.examinationSchedule.findMany({
            where: { examination: { organizationId } },
            include: {
              courseSection: { include: { course: true, enrolments: true } },
              facility: true,
            },
          });

          const items: ScheduleItem[] = rawSchedules.map((s) => ({
            id: s.id,
            courseSectionId: s.courseSectionId || "cs-01",
            courseName: s.courseSection?.course?.title || "Exam",
            examDate: s.examDate.toISOString().split("T")[0],
            startTime: typeof s.startTime === "string" ? s.startTime : s.startTime.toTimeString().slice(0, 5),
            endTime: typeof s.endTime === "string" ? s.endTime : s.endTime.toTimeString().slice(0, 5),
            roomId: s.facilityId || "room-01",
            roomName: s.facility?.roomNumber || "Main Hall",
            roomCapacity: s.facility?.capacity || 60,
            enrolledStudentIds: s.courseSection?.enrolments?.map((e) => e.studentId) || [],
          }));

          const conflicts = ExaminationSchedulingEngine.detectConflicts(items);
          return {
            success: true,
            operation,
            totalSchedulesChecked: items.length,
            conflictsCount: conflicts.length,
            records: conflicts,
          };
        }

        case "invigilation_analysis": {
          const rawSchedules = await db.examinationSchedule.findMany({
            where: { examination: { organizationId } },
            include: {
              courseSection: { include: { course: true, enrolments: true } },
              facility: true,
            },
            take: 20,
          });

          const facultyList = await db.faculty.findMany({
            where: { organizationId, deletedAt: null },
            include: { user: true, department: true, invigilationAssignments: true },
          });

          const candidates: FacultyCandidate[] = facultyList.map((f) => ({
            facultyId: f.id,
            name: f.user?.name || f.title,
            departmentId: f.departmentId,
            departmentCode: f.department.code,
            currentDutiesCount: f.invigilationAssignments.length,
            isAvailable: true,
          }));

          const scheduleItems: ScheduleItem[] = rawSchedules.map((s) => ({
            id: s.id,
            courseSectionId: s.courseSectionId || "cs-01",
            courseName: s.courseSection?.course?.title || "Course Exam",
            examDate: s.examDate.toISOString().split("T")[0],
            startTime: typeof s.startTime === "string" ? s.startTime : s.startTime.toTimeString().slice(0, 5),
            endTime: typeof s.endTime === "string" ? s.endTime : s.endTime.toTimeString().slice(0, 5),
            roomId: s.facilityId || "room-01",
            roomName: s.facility?.roomNumber || "Hall",
            roomCapacity: s.facility?.capacity || 50,
            enrolledStudentIds: [],
          }));

          const report = InvigilationEngine.optimizeInvigilation(scheduleItems, candidates);
          return {
            success: true,
            operation,
            records: report,
          };
        }

        case "exam_results": {
          const results = await db.semesterResult.findMany({
            where: {
              student: { organizationId },
              ...(studentId ? { studentId } : {}),
            },
            include: {
              student: { include: { user: true, department: true } },
            },
            orderBy: { createdAt: "desc" },
            take: limit || 20,
          });

          return {
            success: true,
            operation,
            records: results.map((r) => ({
              id: r.id,
              studentName: r.student.user?.name || "Student",
              studentNumber: r.student.studentNumber,
              term: r.term,
              sgpa: r.sgpa,
              cgpa: r.cgpa,
              backlogsCount: r.backlogsCount,
              totalCredits: r.totalCredits,
            })),
          };
        }

        case "probation_students": {
          const records = await StudentRepository.findProbationStudents(organizationId, gpaThreshold);
          return {
            success: true,
            operation,
            records: records.map((s) => ({
              studentId: s.id,
              name: s.user?.name || "Student",
              email: s.user?.email || "N/A",
              gpa: s.gpa,
              department: s.department.code,
              academicStatus: s.academicStatus,
            })),
          };
        }

        case "financial_ledger": {
          const topBalances = await FinancialRepository.findOutstandingBalances(organizationId, limit);
          const summary = await FinancialRepository.getFinancialSummary(organizationId);
          return {
            success: true,
            operation,
            summary,
            records: topBalances.map((b) => ({
              studentName: b.student.user?.name || "Student",
              balanceOutstanding: b.balanceOutstanding,
              totalBilled: b.totalBilled,
              status: b.status,
            })),
          };
        }

        case "faculty_workload": {
          const loads = await FacultyRepository.findTeachingLoads(organizationId);
          return {
            success: true,
            operation,
            records: loads,
          };
        }

        case "course_catalog": {
          const courses = await CourseRepository.findByOrganization(organizationId);
          return {
            success: true,
            operation,
            records: courses.map((c) => ({
              code: c.code,
              title: c.title,
              credits: c.credits,
              department: c.department.code,
              sectionsCount: c.sections.length,
            })),
          };
        }

        case "course_performance": {
          const records = await AcademicAnalyticsRepository.getCoursePerformance(organizationId);
          return {
            success: true,
            operation,
            records,
          };
        }

        case "department_analytics": {
          const enrollmentStats = await AcademicAnalyticsRepository.getDepartmentEnrollmentStats(organizationId);
          const attendanceOverview = await AcademicAnalyticsRepository.getAttendanceOverview(organizationId);
          return {
            success: true,
            operation,
            records: { enrollmentStats, attendanceOverview },
          };
        }

        case "semester_results": {
          const records = await AcademicAnalyticsRepository.getSemesterResultsSummary(organizationId);
          return {
            success: true,
            operation,
            records,
          };
        }

        case "student_list":
        default: {
          const students = await StudentRepository.findByOrganization(organizationId, limit);
          return {
            success: true,
            operation,
            records: students.map((s) => ({
              studentNumber: s.studentNumber,
              major: s.major,
              gpa: s.gpa,
              department: s.department.code,
            })),
          };
        }
      }
    } catch (error: any) {
      console.error(`[UniversityDatabaseTool] Execution error for operation '${operation}':`, error);
      return {
        success: false,
        operation,
        error: error.message || "Database query execution failed",
        records: [],
      };
    }
  }
}
