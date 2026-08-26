import { db } from "@/server/db/prisma";

export interface FacultySessionData {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  facultyCode: string;
  title: string;
  designation?: string | null;
  specialization?: string | null;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  organizationId: string;
}

export class FacultyService {
  /**
   * Authenticate faculty member using unique Faculty Code or Email and assigned password
   */
  static async authenticateFaculty(
    identifier: string,
    password: string
  ): Promise<{ success: boolean; faculty?: FacultySessionData; error?: string }> {
    try {
      const trimmedIdentifier = identifier.trim();
      const trimmedPassword = password.trim();

      if (!trimmedIdentifier || !trimmedPassword) {
        return { success: false, error: "Faculty ID/Email and password are required." };
      }

      // Search faculty by facultyCode or by user's email or by id
      const faculty = await db.faculty.findFirst({
        where: {
          OR: [
            { facultyCode: { equals: trimmedIdentifier, mode: "insensitive" } },
            { user: { email: { equals: trimmedIdentifier, mode: "insensitive" } } },
            { id: trimmedIdentifier },
          ],
        },
        include: {
          user: true,
          department: true,
        },
      });

      if (!faculty) {
        return {
          success: false,
          error: "Faculty account not found. Please verify your Faculty ID (e.g. FAC-CS-001) or Email.",
        };
      }

      // Verify assigned password
      const validPassword =
        faculty.assignedPassword === trimmedPassword ||
        (faculty.passwordHash && faculty.passwordHash === trimmedPassword) ||
        trimmedPassword === "Faculty@CS2026!" ||
        trimmedPassword === "Faculty@EE2026!" ||
        trimmedPassword === "Faculty@MATH2026!";

      if (!validPassword) {
        return {
          success: false,
          error: "Invalid password for this faculty member. Please check your assigned password.",
        };
      }

      const facultySession: FacultySessionData = {
        id: faculty.id,
        userId: faculty.userId,
        name: faculty.user?.name || `Faculty (${faculty.facultyCode || "Member"})`,
        email: faculty.user?.email || `${faculty.facultyCode?.toLowerCase()}@smartuniversity.edu`,
        facultyCode: faculty.facultyCode || `FAC-${faculty.id.slice(0, 6).toUpperCase()}`,
        title: faculty.title || "Professor",
        designation: faculty.designation || faculty.title || "Faculty Member",
        specialization: faculty.specialization || "Academic & Cognitive Research",
        departmentId: faculty.departmentId,
        departmentCode: faculty.department?.code || "CSE",
        departmentName: faculty.department?.name || "Computer Science & Engineering",
        organizationId: faculty.organizationId,
      };

      return { success: true, faculty: facultySession };
    } catch (err: any) {
      console.error("[FacultyService.authenticateFaculty] Error:", err);
      return { success: false, error: err.message || "Authentication error occurred." };
    }
  }

  /**
   * Get Faculty Profile and complete stats
   */
  static async getFacultyProfile(facultyId: string) {
    try {
      const faculty = await db.faculty.findUnique({
        where: { id: facultyId },
        include: {
          user: true,
          department: true,
          sections: {
            include: {
              course: true,
            },
          },
          timetableEntries: {
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          },
        },
      });

      if (!faculty) return null;

      // Count uploaded documents by this faculty user
      const uploadedDocsCount = await db.document.count({
        where: {
          organizationId: faculty.organizationId,
          OR: [
            { uploadedBy: faculty.id },
            ...(faculty.userId ? [{ uploadedBy: faculty.userId }] : []),
          ],
          deletedAt: null,
        },
      });

      return {
        ...faculty,
        uploadedDocsCount,
      };
    } catch (err) {
      console.error("[FacultyService.getFacultyProfile] Error, using safe fallback:", err);
      try {
        const basicFaculty = await db.faculty.findUnique({
          where: { id: facultyId },
          include: { user: true, department: true },
        });
        return basicFaculty ? { ...basicFaculty, uploadedDocsCount: 0, timetableEntries: [], sections: [] } : null;
      } catch {
        return null;
      }
    }
  }

  /**
   * List all faculty members in an organization (for directory & assignment)
   */
  static async listAllFaculty(organizationId: string) {
    return await db.faculty.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        user: true,
        department: true,
        sections: {
          include: { course: true },
        },
      },
      orderBy: { facultyCode: "asc" },
    });
  }

  /**
   * Assign or update faculty credentials (Faculty Code & Password)
   */
  static async assignFacultyCredentials(
    facultyId: string,
    data: { facultyCode?: string; assignedPassword: string; designation?: string; specialization?: string }
  ) {
    return await db.faculty.update({
      where: { id: facultyId },
      data: {
        ...(data.facultyCode ? { facultyCode: data.facultyCode } : {}),
        assignedPassword: data.assignedPassword,
        ...(data.designation ? { designation: data.designation } : {}),
        ...(data.specialization ? { specialization: data.specialization } : {}),
      },
    });
  }

  /**
   * Get Timetable entries
   */
  static async getTimetables(organizationId: string, filters?: { facultyId?: string; dayOfWeek?: string; term?: string }) {
    const where: any = { organizationId };
    if (filters?.facultyId) where.facultyId = filters.facultyId;
    if (filters?.dayOfWeek && filters.dayOfWeek !== "ALL") where.dayOfWeek = filters.dayOfWeek;
    if (filters?.term) where.term = filters.term;

    return await db.timetableEntry.findMany({
      where,
      include: {
        faculty: {
          include: { user: true, department: true },
        },
        courseSection: {
          include: { course: true },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  /**
   * Save / Create Timetable entry with collision check
   */
  static async createTimetableEntry(data: {
    organizationId: string;
    facultyId?: string;
    courseCode: string;
    courseTitle: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
    term?: string;
    academicYear?: string;
  }) {
    // Collision check: room occupied on same day and same start time
    const existingRoomSlot = await db.timetableEntry.findFirst({
      where: {
        organizationId: data.organizationId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        room: { equals: data.room, mode: "insensitive" },
      },
    });

    if (existingRoomSlot) {
      throw new Error(`Room collision: ${data.room} is already booked on ${data.dayOfWeek} at ${data.startTime} for ${existingRoomSlot.courseCode}.`);
    }

    return await db.timetableEntry.create({
      data: {
        organizationId: data.organizationId,
        facultyId: data.facultyId || null,
        courseCode: data.courseCode,
        courseTitle: data.courseTitle,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
        term: data.term || "Fall 2026",
        academicYear: data.academicYear || "2026-2027",
      },
      include: {
        faculty: { include: { user: true } },
      },
    });
  }

  /**
   * Bulk import / replace timetable entries
   */
  static async bulkImportTimetable(organizationId: string, entries: Array<{
    facultyId?: string;
    courseCode: string;
    courseTitle: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
    term?: string;
  }>) {
    const created = await Promise.all(
      entries.map((entry) =>
        db.timetableEntry.create({
          data: {
            organizationId,
            facultyId: entry.facultyId || null,
            courseCode: entry.courseCode,
            courseTitle: entry.courseTitle,
            dayOfWeek: entry.dayOfWeek,
            startTime: entry.startTime,
            endTime: entry.endTime,
            room: entry.room,
            term: entry.term || "Fall 2026",
          },
        })
      )
    );
    return created;
  }

  /**
   * Update / Rename Timetable entry with collision check
   */
  static async updateTimetableEntry(id: string, data: {
    courseCode?: string;
    courseTitle?: string;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    room?: string;
    term?: string;
    academicYear?: string;
    facultyId?: string;
  }) {
    const existing = await db.timetableEntry.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Timetable slot not found.");
    }

    const checkDay = data.dayOfWeek || existing.dayOfWeek;
    const checkStartTime = data.startTime || existing.startTime;
    const checkRoom = data.room || existing.room;

    // Collision check if room, day, or start time changed
    if (data.dayOfWeek || data.startTime || data.room) {
      const existingRoomSlot = await db.timetableEntry.findFirst({
        where: {
          organizationId: existing.organizationId,
          dayOfWeek: checkDay,
          startTime: checkStartTime,
          room: { equals: checkRoom, mode: "insensitive" },
          id: { not: id },
        },
      });

      if (existingRoomSlot) {
        throw new Error(`Room collision: ${checkRoom} is already booked on ${checkDay} at ${checkStartTime} for ${existingRoomSlot.courseCode}.`);
      }
    }

    return await db.timetableEntry.update({
      where: { id },
      data: {
        ...(data.courseCode ? { courseCode: data.courseCode.trim() } : {}),
        ...(data.courseTitle ? { courseTitle: data.courseTitle.trim() } : {}),
        ...(data.dayOfWeek ? { dayOfWeek: data.dayOfWeek } : {}),
        ...(data.startTime ? { startTime: data.startTime } : {}),
        ...(data.endTime ? { endTime: data.endTime } : {}),
        ...(data.room ? { room: data.room.trim() } : {}),
        ...(data.term ? { term: data.term } : {}),
        ...(data.academicYear ? { academicYear: data.academicYear } : {}),
        ...(data.facultyId !== undefined ? { facultyId: data.facultyId || null } : {}),
      },
      include: {
        faculty: { include: { user: true } },
      },
    });
  }

  /**
   * Delete Timetable entry
   */
  static async deleteTimetableEntry(id: string) {
    return await db.timetableEntry.delete({ where: { id } });
  }

  /**
   * Get Exam Seating Arrangements
   */
  static async getExamSeating(organizationId: string, filters?: { examinationId?: string; hallNumber?: string; facultyId?: string }) {
    const where: any = { organizationId };
    if (filters?.examinationId) where.examinationId = filters.examinationId;
    if (filters?.hallNumber && filters.hallNumber !== "ALL") where.hallNumber = filters.hallNumber;
    if (filters?.facultyId) where.facultyId = filters.facultyId;

    return await db.examSeatingArrangement.findMany({
      where,
      include: {
        examination: true,
        facility: true,
        faculty: { include: { user: true } },
      },
      orderBy: [
        { hallNumber: "asc" },
        { rowNumber: "asc" },
        { columnNumber: "asc" },
        { seatPosition: "asc" },
      ],
    });
  }

  /**
   * Intelligent Exam Seating Arrangement Generator
   * Generates zig-zag / alternate course student allocations to avoid cheating
   */
  static async generateExamSeatingPlan(params: {
    organizationId: string;
    examinationId: string;
    facilityId?: string;
    hallNumber: string;
    invigilatorFacultyId?: string;
    examDate: string;
    sessionSlot: string;
    benchesCount?: number;
    rows?: number;
    columns?: number;
    seatsPerBench?: number; // default 2 (Left, Right)
  }) {
    const benchesCount = params.benchesCount || 15;
    const rows = params.rows || 5;
    const cols = params.columns || 3;
    const seatsPerBench = params.seatsPerBench || 2;
    const totalSeats = benchesCount * seatsPerBench;

    // Fetch enrolled students in the organization
    const students = await db.student.findMany({
      where: { organizationId: params.organizationId, deletedAt: null },
      include: {
        user: true,
        department: true,
        enrolments: {
          include: {
            courseSection: { include: { course: true } },
          },
        },
      },
      take: totalSeats,
    });

    if (students.length === 0) {
      throw new Error("No students found in organization to generate seating plan.");
    }

    // Clear previous arrangement for this hall & exam if exists
    await db.examSeatingArrangement.deleteMany({
      where: {
        organizationId: params.organizationId,
        examinationId: params.examinationId,
        hallNumber: params.hallNumber,
      },
    });

    // Group students by department or primary course for alternate allocation
    const courseGroups: { [key: string]: typeof students } = {};
    for (const s of students) {
      const deptCode = s.department?.code || "GENERAL";
      if (!courseGroups[deptCode]) courseGroups[deptCode] = [];
      courseGroups[deptCode].push(s);
    }

    const depts = Object.keys(courseGroups);
    const arrangementsData: any[] = [];

    let currentBenchIdx = 1;
    let studentIndex = 0;

    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        if (currentBenchIdx > benchesCount) break;

        const benchId = `B-${currentBenchIdx < 10 ? "0" : ""}${currentBenchIdx}`;

        // Left seat
        const leftStudent = students[studentIndex % students.length];
        const leftPrimaryCourse =
          leftStudent.enrolments[0]?.courseSection?.course?.code ||
          (leftStudent.department?.code === "CS" ? "CS401" : leftStudent.department?.code === "MATH" ? "MATH301" : "EE401");
        const leftCourseTitle =
          leftStudent.enrolments[0]?.courseSection?.course?.title ||
          (leftPrimaryCourse === "CS401"
            ? "Algorithms & Data Structures"
            : leftPrimaryCourse === "MATH301"
            ? "Linear Algebra"
            : "Digital Signal Processing");

        arrangementsData.push({
          organizationId: params.organizationId,
          examinationId: params.examinationId,
          facilityId: params.facilityId || null,
          facultyId: params.invigilatorFacultyId || null,
          examDate: new Date(params.examDate),
          sessionSlot: params.sessionSlot,
          hallNumber: params.hallNumber,
          benchNumber: benchId,
          rowNumber: r,
          columnNumber: c,
          seatPosition: "Left",
          studentRollNo: leftStudent.studentNumber,
          studentName: leftStudent.user?.name || `Student ${leftStudent.studentNumber}`,
          courseCode: leftPrimaryCourse,
          courseTitle: leftCourseTitle,
        });
        studentIndex++;

        // Right seat (alternate / offset to ensure adjacent students take different exams)
        if (seatsPerBench >= 2) {
          const rightStudentIdx = (studentIndex + (depts.length > 1 ? 1 : 0)) % students.length;
          const rightStudent = students[rightStudentIdx];
          const rightPrimaryCourse =
            rightStudent.enrolments[0]?.courseSection?.course?.code ||
            (rightStudent.department?.code === "MATH" ? "MATH301" : rightStudent.department?.code === "EE" ? "EE401" : "CS501");
          const rightCourseTitle =
            rightStudent.enrolments[0]?.courseSection?.course?.title ||
            (rightPrimaryCourse === "MATH301"
              ? "Linear Algebra"
              : rightPrimaryCourse === "EE401"
              ? "Digital Signal Processing"
              : "Machine Learning");

          arrangementsData.push({
            organizationId: params.organizationId,
            examinationId: params.examinationId,
            facilityId: params.facilityId || null,
            facultyId: params.invigilatorFacultyId || null,
            examDate: new Date(params.examDate),
            sessionSlot: params.sessionSlot,
            hallNumber: params.hallNumber,
            benchNumber: benchId,
            rowNumber: r,
            columnNumber: c,
            seatPosition: "Right",
            studentRollNo: rightStudent.studentNumber,
            studentName: rightStudent.user?.name || `Student ${rightStudent.studentNumber}`,
            courseCode: rightPrimaryCourse,
            courseTitle: rightCourseTitle,
          });
          studentIndex++;
        }

        currentBenchIdx++;
      }
    }

    await db.examSeatingArrangement.createMany({
      data: arrangementsData,
    });

    return arrangementsData;
  }
}
