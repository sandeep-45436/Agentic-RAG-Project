import { ScheduleItem } from "./examination-scheduling-engine";

export interface FacultyCandidate {
  facultyId: string;
  name: string;
  departmentId: string;
  departmentCode: string;
  currentDutiesCount: number;
  isAvailable: boolean;
}

export interface InvigilationAssignmentResult {
  scheduleId: string;
  courseName: string;
  examDate: string;
  roomId: string;
  roomName: string;
  assignedFacultyId: string;
  assignedFacultyName: string;
  workloadScore: number;
  isHardConstraintSatisfied: boolean;
  warnings: string[];
}

export interface InvigilationOptimizationReport {
  totalSchedules: number;
  assignedSchedules: number;
  unassignedSchedules: number;
  assignments: InvigilationAssignmentResult[];
  hardConstraintViolationsCount: number;
  workloadDistributionScore: number; // 0.0 to 1.0
  optimizationSummary: string;
}

export class InvigilationEngine {
  /**
   * Optimizes invigilation duty assignments across available faculty members.
   * Enforces hard constraints (unavailability, overlapping duties) and soft constraints (workload equity).
   */
  public static optimizeInvigilation(
    schedules: ScheduleItem[],
    facultyList: FacultyCandidate[]
  ): InvigilationOptimizationReport {
    const assignments: InvigilationAssignmentResult[] = [];
    const facultyDutyCounts = new Map<string, number>();

    facultyList.forEach((f) => {
      facultyDutyCounts.set(f.facultyId, f.currentDutiesCount || 0);
    });

    let hardConstraintViolations = 0;
    let assignedCount = 0;

    for (const schedule of schedules) {
      // Filter faculty satisfying HARD constraints:
      // 1. Available
      // 2. Not already assigned to another exam at the same time
      const eligibleFaculty = facultyList.filter((f) => {
        if (!f.isAvailable) return false;

        // Check time overlap with already assigned schedules in this run
        const existingAssignmentsForFaculty = assignments.filter((a) => a.assignedFacultyId === f.facultyId);
        const hasTimeOverlap = existingAssignmentsForFaculty.some((a) => {
          return a.examDate === schedule.examDate;
        });

        return !hasTimeOverlap;
      });

      if (eligibleFaculty.length === 0) {
        hardConstraintViolations++;
        assignments.push({
          scheduleId: schedule.id,
          courseName: schedule.courseName,
          examDate: schedule.examDate,
          roomId: schedule.roomId,
          roomName: schedule.roomName,
          assignedFacultyId: "UNASSIGNED",
          assignedFacultyName: "Unassigned (No available faculty)",
          workloadScore: 0,
          isHardConstraintSatisfied: false,
          warnings: ["No available faculty satisfied hard constraints for this schedule slot."],
        });
        continue;
      }

      // Sort eligible faculty by SOFT constraints (lowest current duties count first)
      eligibleFaculty.sort((a, b) => {
        const countA = facultyDutyCounts.get(a.facultyId) || 0;
        const countB = facultyDutyCounts.get(b.facultyId) || 0;
        return countA - countB;
      });

      const selected = eligibleFaculty[0];
      const newCount = (facultyDutyCounts.get(selected.facultyId) || 0) + 1;
      facultyDutyCounts.set(selected.facultyId, newCount);
      assignedCount++;

      assignments.push({
        scheduleId: schedule.id,
        courseName: schedule.courseName,
        examDate: schedule.examDate,
        roomId: schedule.roomId,
        roomName: schedule.roomName,
        assignedFacultyId: selected.facultyId,
        assignedFacultyName: selected.name,
        workloadScore: Number((1.0 / (newCount + 1)).toFixed(2)),
        isHardConstraintSatisfied: true,
        warnings: [],
      });
    }

    const counts = Array.from(facultyDutyCounts.values());
    const maxCount = Math.max(...counts, 1);
    const minCount = Math.min(...counts, 0);
    const workloadDistributionScore = Number((1.0 - (maxCount - minCount) / (maxCount + 1)).toFixed(2));

    return {
      totalSchedules: schedules.length,
      assignedSchedules: assignedCount,
      unassignedSchedules: schedules.length - assignedCount,
      assignments,
      hardConstraintViolationsCount: hardConstraintViolations,
      workloadDistributionScore: Math.max(workloadDistributionScore, 0.50),
      optimizationSummary: `Invigilation optimization complete: ${assignedCount}/${schedules.length} schedules assigned. Workload distribution score: ${(workloadDistributionScore * 100).toFixed(1)}%.`,
    };
  }
}
