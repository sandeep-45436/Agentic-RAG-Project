import { db } from "@/server/db/prisma";

/**
 * Academic Analytics Repository — aggregate queries for operational intelligence.
 * Provides course performance, enrollment stats, attendance overviews, and semester summaries.
 */
export class AcademicAnalyticsRepository {
  /**
   * Returns course performance metrics: pass/fail counts, average GPA, failure rate.
   */
  static async getCoursePerformance(organizationId: string) {
    const courses = await db.course.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        department: true,
        sections: {
          include: {
            enrolments: {
              include: {
                student: {
                  include: {
                    semesterResults: { orderBy: { createdAt: "desc" }, take: 1 },
                  },
                },
              },
            },
          },
        },
      },
    });

    return courses.map((course: any) => {
      const allStudents = (course.sections || []).flatMap((s: any) =>
        (s.enrolments || []).map((e: any) => e.student)
      ).filter(Boolean);
      const totalEnrolled = allStudents.length;
      const studentsWithResults = allStudents.filter((s: any) => s.semesterResults && s.semesterResults.length > 0);
      const failingStudents = studentsWithResults.filter(
        (s: any) => s.semesterResults[0]?.sgpa !== undefined && s.semesterResults[0].sgpa < 2.0
      );
      const avgGpa =
        studentsWithResults.length > 0
          ? studentsWithResults.reduce((sum: number, s: any) => sum + (s.semesterResults[0]?.sgpa || 0), 0) /
            studentsWithResults.length
          : 0;

      return {
        courseCode: course.code,
        courseTitle: course.title,
        department: course.department?.code || "UNKNOWN",
        credits: course.credits,
        totalEnrolled,
        studentsWithResults: studentsWithResults.length,
        failingCount: failingStudents.length,
        failureRate: totalEnrolled > 0 ? Number(((failingStudents.length / totalEnrolled) * 100).toFixed(1)) : 0,
        averageGpa: Number(avgGpa.toFixed(2)),
      };
    });
  }

  /**
   * Returns department-level enrollment and capacity statistics.
   */
  static async getDepartmentEnrollmentStats(organizationId: string) {
    const departments = await db.department.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        students: { where: { deletedAt: null } },
        faculty: { where: { deletedAt: null } },
        courses: {
          where: { deletedAt: null },
          include: { sections: true },
        },
      },
    });

    return departments.map((dept) => ({
      departmentCode: dept.code,
      departmentName: dept.name,
      totalStudents: dept.students.length,
      totalFaculty: dept.faculty.length,
      studentFacultyRatio: dept.faculty.length > 0 ? Number((dept.students.length / dept.faculty.length).toFixed(1)) : 0,
      totalCourses: dept.courses.length,
      totalSections: dept.courses.reduce((sum, c) => sum + c.sections.length, 0),
    }));
  }

  /**
   * Returns attendance overview: department averages and students below threshold.
   */
  static async getAttendanceOverview(organizationId: string) {
    const students = await db.student.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        user: true,
        department: true,
        attendanceRecords: true,
      },
    });

    const THRESHOLD = 75.0;
    const belowThreshold: Array<{
      studentName: string;
      studentNumber: string;
      department: string;
      lowestAttendance: number;
    }> = [];

    const deptAverages: Record<string, { total: number; count: number }> = {};

    for (const student of students) {
      const records = student.attendanceRecords || [];
      if (records.length === 0) continue;

      const avgAtt = records.reduce((sum, r) => sum + (r.percentage ?? 100), 0) / records.length;
      const lowest = Math.min(...records.map((r) => r.percentage ?? 100));
      const deptCode = student.department?.code || "UNKNOWN";

      if (!deptAverages[deptCode]) deptAverages[deptCode] = { total: 0, count: 0 };
      deptAverages[deptCode].total += avgAtt;
      deptAverages[deptCode].count += 1;

      if (lowest < THRESHOLD) {
        belowThreshold.push({
          studentName: student.user?.name || student.studentNumber,
          studentNumber: student.studentNumber,
          department: deptCode,
          lowestAttendance: Number(lowest.toFixed(1)),
        });
      }
    }

    const departmentAverages = Object.entries(deptAverages).map(([code, data]) => ({
      department: code,
      averageAttendance: Number((data.total / data.count).toFixed(1)),
      studentCount: data.count,
    }));

    return {
      totalStudents: students.length,
      belowThresholdCount: belowThreshold.length,
      threshold: THRESHOLD,
      departmentAverages,
      studentsBelow: belowThreshold,
    };
  }

  /**
   * Returns semester results summary: GPA distribution, pass rate, backlog counts.
   */
  static async getSemesterResultsSummary(organizationId: string) {
    const students = await db.student.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        user: true,
        department: true,
        semesterResults: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    const withResults = students.filter((s) => s.semesterResults.length > 0);
    const totalBacklogs = withResults.reduce((sum, s) => sum + (s.semesterResults[0]?.backlogsCount || 0), 0);
    const studentsWithBacklogs = withResults.filter((s) => (s.semesterResults[0]?.backlogsCount || 0) > 0);
    const avgGpa = withResults.length > 0
      ? withResults.reduce((sum, s) => sum + (s.semesterResults[0]?.sgpa || 0), 0) / withResults.length
      : 0;
    const passCount = withResults.filter((s) => (s.semesterResults[0]?.sgpa || 0) >= 2.0).length;

    return {
      totalStudents: students.length,
      studentsWithResults: withResults.length,
      averageGpa: Number(avgGpa.toFixed(2)),
      passCount,
      failCount: withResults.length - passCount,
      passRate: withResults.length > 0 ? Number(((passCount / withResults.length) * 100).toFixed(1)) : 0,
      totalBacklogs,
      studentsWithBacklogs: studentsWithBacklogs.length,
    };
  }
}
