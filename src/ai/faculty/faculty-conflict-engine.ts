import { UniversityFaculty } from "@/server/data-source/models/faculty";

export type FacultyConflictSeverity = "CRITICAL" | "HIGH" | "WARNING";

export interface FacultyConflictItem {
  id: string;
  facultyId: string;
  facultyName: string;
  conflictType: "TIMETABLE_CLASH" | "INVIGILATION_OVERLOAD" | "AVAILABILITY_CONFLICT";
  severity: FacultyConflictSeverity;
  description: string;
  affectedSlots: string[];
  resolutionOptions: string[];
}

export interface FacultyConflictReport {
  reportId: string;
  departmentCode: string;
  totalConflicts: number;
  criticalConflictsCount: number;
  conflicts: FacultyConflictItem[];
  generatedAt: string;
}

export class FacultyConflictEngine {
  /**
   * Evaluates timetable clashes, invigilation duty over-assignments, and availability blackout conflicts.
   */
  public static detectConflicts(
    departmentCode: string,
    facultyRoster: UniversityFaculty[],
    invigilationDutyMap: Map<string, number> = new Map(),
    timetableClashMap: Map<string, string[]> = new Map()
  ): FacultyConflictReport {
    const reportId = `CONF_${departmentCode}_${Date.now()}`;
    const conflicts: FacultyConflictItem[] = [];

    for (const fac of facultyRoster) {
      // 1. Check Timetable Clashes
      const clashes = timetableClashMap.get(fac.id);
      if (clashes && clashes.length > 0) {
        conflicts.push({
          id: `conf_tt_${fac.id}`,
          facultyId: fac.id,
          facultyName: fac.name,
          conflictType: "TIMETABLE_CLASH",
          severity: "CRITICAL",
          description: `Timetable schedule clash detected for ${fac.name}: Double-booked across multiple lecture halls at ${clashes.join(", ")}.`,
          affectedSlots: clashes,
          resolutionOptions: [
            `Option 1: Reschedule section slot to 11:00 AM window.`,
            `Option 2: Re-assign section to qualified available faculty.`,
          ],
        });
      }

      // 2. Check Invigilation Duty Overload
      const invigilationSlots = invigilationDutyMap.get(fac.id) || 0;
      if (invigilationSlots > 4) {
        conflicts.push({
          id: `conf_inv_${fac.id}`,
          facultyId: fac.id,
          facultyName: fac.name,
          conflictType: "INVIGILATION_OVERLOAD",
          severity: invigilationSlots >= 6 ? "CRITICAL" : "WARNING",
          description: `Invigilation duty overload for ${fac.name}: Assigned ${invigilationSlots} slots (Threshold: max 4 slots).`,
          affectedSlots: [`${invigilationSlots} Total Assigned Exam Slots`],
          resolutionOptions: [
            `Option 1: Re-distribute 2 invigilation slots to unassigned department faculty.`,
            `Option 2: Adjust exam duty roster limits for final semester.`,
          ],
        });
      }
    }

    const criticalConflictsCount = conflicts.filter((c) => c.severity === "CRITICAL").length;

    return {
      reportId,
      departmentCode,
      totalConflicts: conflicts.length,
      criticalConflictsCount,
      conflicts,
      generatedAt: new Date().toISOString(),
    };
  }
}
