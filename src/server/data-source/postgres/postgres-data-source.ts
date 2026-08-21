import { db } from "@/server/db/prisma";
import { UniversityDataSource } from "../university-data-source";
import { UniversityStudent, StudentAcademicStatus } from "../models/student";
import { UniversityAttendance } from "../models/attendance";
import { UniversityFinance } from "../models/finance";
import { UniversityExamination, UniversityEligibilityRecord } from "../models/examination";

export class PostgresDataSource implements UniversityDataSource {
  public readonly mode = "postgres";

  public students = {
    findStudentById: async (studentId: string, organizationId: string): Promise<UniversityStudent | null> => {
      const student = await db.student.findFirst({
        where: { id: studentId, organizationId, deletedAt: null },
        include: { user: true, department: true },
      });

      if (!student) return null;

      let status: StudentAcademicStatus = "GOOD_STANDING";
      if (student.academicStatus === "Academic Probation") status = "PROBATION";
      else if (student.academicStatus === "Suspended") status = "SUSPENDED";

      return {
        id: student.id,
        universityStudentId: student.studentNumber,
        name: student.user?.name || "Student",
        email: student.user?.email || "",
        departmentId: student.departmentId,
        departmentCode: student.department?.code || "GEN",
        major: student.major,
        gpa: student.gpa,
        academicStatus: status,
        advisorId: student.advisorId || undefined,
        organizationId: student.organizationId,
      };
    },

    findProbationStudents: async (organizationId: string, gpaThreshold: number): Promise<UniversityStudent[]> => {
      const list = await db.student.findMany({
        where: {
          organizationId,
          deletedAt: null,
          OR: [{ gpa: { lt: gpaThreshold } }, { academicStatus: "Academic Probation" }],
        },
        include: { user: true, department: true },
      });

      return list.map((student) => ({
        id: student.id,
        universityStudentId: student.studentNumber,
        name: student.user?.name || "Student",
        email: student.user?.email || "",
        departmentId: student.departmentId,
        departmentCode: student.department?.code || "GEN",
        major: student.major,
        gpa: student.gpa,
        academicStatus: "PROBATION" as StudentAcademicStatus,
        advisorId: student.advisorId || undefined,
        organizationId: student.organizationId,
      }));
    },

    listStudents: async (organizationId: string): Promise<UniversityStudent[]> => {
      const list = await db.student.findMany({
        where: { organizationId, deletedAt: null },
        include: { user: true, department: true },
      });

      return list.map((student) => ({
        id: student.id,
        universityStudentId: student.studentNumber,
        name: student.user?.name || "Student",
        email: student.user?.email || "",
        departmentId: student.departmentId,
        departmentCode: student.department?.code || "GEN",
        major: student.major,
        gpa: student.gpa,
        academicStatus: "GOOD_STANDING" as StudentAcademicStatus,
        advisorId: student.advisorId || undefined,
        organizationId: student.organizationId,
      }));
    },
  };

  public attendance = {
    getStudentAttendance: async (studentId: string, organizationId: string): Promise<UniversityAttendance | null> => {
      const rec = await db.attendanceRecord.findFirst({
        where: { studentId, organizationId },
      });

      if (!rec) return null;

      return {
        id: rec.id,
        studentId: rec.studentId,
        courseSectionId: rec.courseSectionId || undefined,
        totalClasses: rec.totalClasses,
        attendedClasses: rec.attendedClasses,
        percentage: rec.percentage,
        lastUpdated: rec.lastUpdated,
        organizationId: rec.organizationId,
      };
    },

    getAttendanceShortfallStudents: async (organizationId: string, thresholdPercentage: number): Promise<UniversityAttendance[]> => {
      const records = await db.attendanceRecord.findMany({
        where: { organizationId, percentage: { lt: thresholdPercentage } },
      });

      return records.map((rec) => ({
        id: rec.id,
        studentId: rec.studentId,
        courseSectionId: rec.courseSectionId || undefined,
        totalClasses: rec.totalClasses,
        attendedClasses: rec.attendedClasses,
        percentage: rec.percentage,
        lastUpdated: rec.lastUpdated,
        organizationId: rec.organizationId,
      }));
    },
  };

  public examinations = {
    getExaminationById: async (examinationId: string, organizationId: string): Promise<UniversityExamination | null> => {
      const exam = await db.examination.findFirst({
        where: { id: examinationId, organizationId, deletedAt: null },
      });

      if (!exam) return null;

      return {
        id: exam.id,
        name: exam.name,
        term: exam.term,
        academicYear: exam.academicYear,
        startDate: exam.startDate,
        endDate: exam.endDate,
        status: exam.status,
        organizationId: exam.organizationId,
      };
    },

    listExaminations: async (organizationId: string): Promise<UniversityExamination[]> => {
      const exams = await db.examination.findMany({
        where: { organizationId, deletedAt: null },
      });

      return exams.map((exam) => ({
        id: exam.id,
        name: exam.name,
        term: exam.term,
        academicYear: exam.academicYear,
        startDate: exam.startDate,
        endDate: exam.endDate,
        status: exam.status,
        organizationId: exam.organizationId,
      }));
    },

    getSchedules: async () => [],
    saveEligibility: async () => {},
    getEligibilityRoster: async (): Promise<UniversityEligibilityRecord[]> => [],
  };

  public finance = {
    getStudentBalance: async (studentId: string, organizationId: string): Promise<UniversityFinance | null> => {
      const fin = await db.financialAccount.findFirst({
        where: { studentId, organizationId },
      });

      if (!fin) return null;

      let status: "PAID" | "PENDING" | "OVERDUE" = "PAID";
      if (fin.status === "Overdue") status = "OVERDUE";
      else if (fin.status === "Pending" || fin.balanceOutstanding > 0) status = "PENDING";

      return {
        id: fin.id,
        studentId: fin.studentId,
        totalBilled: fin.totalBilled,
        totalPaid: fin.totalPaid,
        balanceOutstanding: fin.balanceOutstanding,
        status,
        organizationId: fin.organizationId,
      };
    },

    getOutstandingBalances: async (organizationId: string, limit: number): Promise<UniversityFinance[]> => {
      const list = await db.financialAccount.findMany({
        where: { organizationId, balanceOutstanding: { gt: 0 } },
        take: limit,
      });

      return list.map((fin) => ({
        id: fin.id,
        studentId: fin.studentId,
        totalBilled: fin.totalBilled,
        totalPaid: fin.totalPaid,
        balanceOutstanding: fin.balanceOutstanding,
        status: "PENDING",
        organizationId: fin.organizationId,
      }));
    },
  };

  public faculty = {
    listFaculty: async () => [],
  };

  public courses = {
    listCourses: async () => [],
    getCourseSections: async () => [],
  };

  public results = {
    getStudentResults: async () => [],
  };
}
