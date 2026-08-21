import { db } from "@/server/db/prisma";

export class CourseRepository {
  static async findByOrganization(organizationId: string) {
    return db.course.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        department: { select: { name: true, code: true } },
        sections: {
          select: {
            id: true,
            sectionCode: true,
            term: true,
            room: true,
            scheduleText: true,
            capacity: true,
          },
        },
      },
    });
  }

  static async findCourseWithSections(organizationId: string, courseCode: string) {
    return db.course.findFirst({
      where: {
        organizationId,
        code: courseCode,
        deletedAt: null,
      },
      include: {
        department: { select: { name: true, code: true } },
        sections: {
          include: {
            faculty: { include: { user: { select: { name: true } } } },
            enrolments: { select: { id: true } },
          },
        },
      },
    });
  }
}
