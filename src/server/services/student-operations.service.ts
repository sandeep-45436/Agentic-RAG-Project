import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class StudentOperationsService {
  public static async getStudentFullProfile(identifier: string, organizationId: string) {
    try {
      const student = await prisma.student.findFirst({
        where: {
          organizationId,
          OR: [
            { id: identifier },
            { studentNumber: identifier },
            { user: { email: { contains: identifier, mode: "insensitive" } } },
            { user: { name: { contains: identifier, mode: "insensitive" } } },
          ],
        },
        include: {
          user: true,
          department: true,
          advisor: {
            include: { user: true },
          },
          attendanceRecords: true,
          internalMarks: true,
          semesterResults: {
            orderBy: { createdAt: "desc" },
          },
          hostelRecord: true,
          scholarshipRecord: true,
          parentInfo: true,
          financialAccounts: true,
        },
      });

      return student;
    } catch (error) {
      console.error("[StudentOperationsService] Error fetching student profile:", error);
      return null;
    }
  }

  public static async getAllProbationStudents(organizationId: string) {
    try {
      return await prisma.student.findMany({
        where: {
          organizationId,
          academicStatus: "Academic Probation",
        },
        include: {
          user: true,
          department: true,
          attendanceRecords: true,
          scholarshipRecord: true,
        },
      });
    } catch (error) {
      console.error("[StudentOperationsService] Error fetching probation students:", error);
      return [];
    }
  }

  /**
   * Returns all students who are ineligible for exams based on attendance < 75%,
   * outstanding fees, or suspension status.
   */
  public static async getExamIneligibleStudents(organizationId: string) {
    const students = await prisma.student.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        user: true,
        department: true,
        attendanceRecords: true,
        financialAccounts: true,
        semesterResults: { orderBy: { createdAt: "desc" } },
      },
    });

    const { ExamEligibilityEngine } = await import("@/ai/decision/exam-eligibility-engine");
    return ExamEligibilityEngine.getIneligibleStudents(students);
  }

  /**
   * Returns students filtered by department with full profiles.
   */
  public static async getStudentsByDepartment(organizationId: string, departmentCode: string) {
    return prisma.student.findMany({
      where: {
        organizationId,
        deletedAt: null,
        department: { code: departmentCode.toUpperCase() },
      },
      include: {
        user: true,
        department: true,
        attendanceRecords: true,
        internalMarks: true,
        semesterResults: { orderBy: { createdAt: "desc" } },
        financialAccounts: true,
      },
    });
  }
}
