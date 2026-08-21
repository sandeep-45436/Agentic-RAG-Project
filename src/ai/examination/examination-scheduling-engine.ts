export type ConflictType =
  | "STUDENT_CLASH"
  | "ROOM_CLASH"
  | "ROOM_CAPACITY"
  | "FACULTY_CLASH"
  | "FACULTY_OVERLOAD"
  | "TIME_OVERLAP";

export interface ExaminationConflict {
  conflictId: string;
  type: ConflictType;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  affectedEntityIds: string[];
  scheduleIds: string[];
  description: string;
  recommendedResolution: string;
}

export interface ScheduleItem {
  id: string;
  courseSectionId: string;
  courseName: string;
  examDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  roomId: string;
  roomName: string;
  roomCapacity: Int32Array | number;
  enrolledStudentIds: string[];
  assignedFacultyId?: string;
}

export class ExaminationSchedulingEngine {
  /**
   * Deterministically detects scheduling clashes across student timetables, exam room double-bookings,
   * facility capacity limits, and faculty invigilation conflicts.
   */
  public static detectConflicts(schedules: ScheduleItem[]): ExaminationConflict[] {
    const conflicts: ExaminationConflict[] = [];

    // 1. Room Double-Booking Check (ROOM_CLASH)
    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const s1 = schedules[i];
        const s2 = schedules[j];

        if (s1.examDate === s2.examDate && s1.roomId === s2.roomId) {
          if (this.checkTimeOverlap(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) {
            conflicts.push({
              conflictId: `CONF_ROOM_${s1.id}_${s2.id}`,
              type: "ROOM_CLASH",
              severity: "CRITICAL",
              affectedEntityIds: [s1.roomId],
              scheduleIds: [s1.id, s2.id],
              description: `Room '${s1.roomName}' is double-booked on ${s1.examDate} between ${s1.courseName} and ${s2.courseName}.`,
              recommendedResolution: `Reschedule one of the exams to a different room or time slot.`,
            });
          }
        }
      }
    }

    // 2. Room Capacity Violation Check (ROOM_CAPACITY)
    for (const schedule of schedules) {
      const studentCount = schedule.enrolledStudentIds.length;
      const capacity = Number(schedule.roomCapacity);
      if (studentCount > capacity) {
        conflicts.push({
          conflictId: `CONF_CAP_${schedule.id}`,
          type: "ROOM_CAPACITY",
          severity: "HIGH",
          affectedEntityIds: [schedule.id, schedule.roomId],
          scheduleIds: [schedule.id],
          description: `Room '${schedule.roomName}' capacity exceeded for ${schedule.courseName}: ${studentCount} enrolled vs ${capacity} capacity.`,
          recommendedResolution: `Assign an additional room or split section into multiple halls.`,
        });
      }
    }

    // 3. Student Timetable Clash Check (STUDENT_CLASH)
    const studentSchedulesMap = new Map<string, ScheduleItem[]>();
    for (const schedule of schedules) {
      for (const studentId of schedule.enrolledStudentIds) {
        const list = studentSchedulesMap.get(studentId) || [];
        list.push(schedule);
        studentSchedulesMap.set(studentId, list);
      }
    }

    const flaggedStudentPairs = new Set<string>();
    for (const [studentId, studentExams] of studentSchedulesMap.entries()) {
      for (let i = 0; i < studentExams.length; i++) {
        for (let j = i + 1; j < studentExams.length; j++) {
          const e1 = studentExams[i];
          const e2 = studentExams[j];
          if (e1.examDate === e2.examDate && this.checkTimeOverlap(e1.startTime, e1.endTime, e2.startTime, e2.endTime)) {
            const pairKey = [e1.id, e2.id].sort().join("_");
            if (!flaggedStudentPairs.has(pairKey)) {
              flaggedStudentPairs.add(pairKey);
              conflicts.push({
                conflictId: `CONF_STUDENT_${pairKey}`,
                type: "STUDENT_CLASH",
                severity: "CRITICAL",
                affectedEntityIds: [studentId],
                scheduleIds: [e1.id, e2.id],
                description: `Student timetable clash detected between ${e1.courseName} and ${e2.courseName} on ${e1.examDate}.`,
                recommendedResolution: `Shift one course exam time slot.`,
              });
            }
          }
        }
      }
    }

    // 4. Faculty Invigilation Clash Check (FACULTY_CLASH)
    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const s1 = schedules[i];
        const s2 = schedules[j];
        if (s1.assignedFacultyId && s2.assignedFacultyId && s1.assignedFacultyId === s2.assignedFacultyId) {
          if (s1.examDate === s2.examDate && this.checkTimeOverlap(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) {
            conflicts.push({
              conflictId: `CONF_FACULTY_${s1.id}_${s2.id}`,
              type: "FACULTY_CLASH",
              severity: "HIGH",
              affectedEntityIds: [s1.assignedFacultyId],
              scheduleIds: [s1.id, s2.id],
              description: `Faculty member is assigned to invigilate two simultaneous exams on ${s1.examDate}.`,
              recommendedResolution: `Reassign invigilation duty to another available faculty member.`,
            });
          }
        }
      }
    }

    return conflicts;
  }

  private static checkTimeOverlap(s1Start: string, s1End: string, s2Start: string, s2End: string): boolean {
    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    const start1 = toMinutes(s1Start);
    const end1 = toMinutes(s1End);
    const start2 = toMinutes(s2Start);
    const end2 = toMinutes(s2End);

    return Math.max(start1, start2) < Math.min(end1, end2);
  }
}
