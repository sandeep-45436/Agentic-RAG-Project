import { z } from "zod";
import { StudentRepository } from "@/server/repositories/student.repository";
import { FacultyRepository } from "@/server/repositories/faculty.repository";
import { CourseRepository } from "@/server/repositories/course.repository";
import { FinancialRepository } from "@/server/repositories/financial.repository";
import { StudentOperationsService } from "@/server/services/student-operations.service";
import { AcademicAnalyticsRepository } from "@/server/repositories/academic-analytics.repository";
import { ExaminationRepository } from "@/server/repositories/examination.repository";
import { ExaminationAnalyticsRepository } from "@/server/repositories/examination-analytics.repository";

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
          const list = await ExaminationRepository.getEligibilityRoster(examinationId || "exam_default", organizationId);
          return {
            success: true,
            operation,
            records: list,
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

        case "exam_eligibility": {
          const records = await StudentOperationsService.getExamIneligibleStudents(organizationId);
          return {
            success: true,
            operation,
            records,
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
