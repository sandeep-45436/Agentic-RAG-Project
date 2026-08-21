import { db } from "@/server/db/prisma";

export class FacultyRepository {
  static async findByOrganization(organizationId: string) {
    return db.faculty.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        department: { select: { name: true, code: true } },
        user: { select: { name: true, email: true } },
        sections: { select: { sectionCode: true, term: true, courseId: true } },
      },
    });
  }

  static async findTeachingLoads(organizationId: string) {
    const facultyList = await db.faculty.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        department: { select: { name: true, code: true } },
        user: { select: { name: true, email: true } },
        sections: {
          select: {
            id: true,
            sectionCode: true,
            term: true,
            course: { select: { code: true, title: true } },
          },
        },
      },
    });

    return facultyList.map((f) => ({
      id: f.id,
      name: f.user?.name || "Professor",
      department: f.department.name,
      title: f.title,
      tenureStatus: f.tenureStatus,
      coursesTaughtCount: f.sections.length,
      sections: f.sections,
    }));
  }
}
