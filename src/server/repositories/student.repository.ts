import { db } from "@/server/db/prisma";

export class StudentRepository {
  static async findByOrganization(organizationId: string, limit = 20) {
    return db.student.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        department: { select: { name: true, code: true } },
        user: { select: { name: true, email: true } },
      },
      take: limit,
      orderBy: { gpa: "asc" },
    });
  }

  static async findProbationStudents(organizationId: string, gpaThreshold = 2.0) {
    return db.student.findMany({
      where: {
        organizationId,
        gpa: { lt: gpaThreshold },
        deletedAt: null,
      },
      include: {
        department: { select: { name: true, code: true } },
        user: { select: { name: true, email: true } },
        financialAccounts: { select: { balanceOutstanding: true, status: true } },
      },
      orderBy: { gpa: "asc" },
    });
  }

  static async findByDepartment(organizationId: string, departmentCode: string) {
    return db.student.findMany({
      where: {
        organizationId,
        department: { code: departmentCode },
        deletedAt: null,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });
  }
}
