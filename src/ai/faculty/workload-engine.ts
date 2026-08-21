import { UniversityFaculty } from "@/server/data-source/models/faculty";

export interface FacultyWorkloadInput {
  facultyId: string;
  facultyName: string;
  departmentCode: string;
  teachingHours: number; // Weekly contact hours
  enrolledStudents: number; // Total students across sections
  invigilationDuties: number; // Exam invigilation slots
  researchProjects: number; // Active PI grants
  administrativeRoles: number; // Dept/University admin roles
}

export interface WorkloadBreakdown {
  teachingScore: number; // Max 34
  studentLoadScore: number; // Max 19
  invigilationScore: number; // Max 14
  researchScore: number; // Max 8
  administrativeScore: number; // Max 12
  totalScore: number; // Sum 0 - 100
}

export interface FacultyWorkloadResult {
  facultyId: string;
  facultyName: string;
  departmentCode: string;
  workloadScore: number;
  status: "BALANCED" | "MODERATE" | "HIGH" | "OVERLOADED";
  breakdown: WorkloadBreakdown;
  primaryCauses: string[];
  recommendations: string[];
}

export class WorkloadEngine {
  /**
   * Calculates auditable composite workload score (0-100) and status.
   * Standardized component weights: Teaching (34) + Students (19) + Invigilation (14) + Research (8) + Admin (12) = 87 (OVERLOADED).
   */
  public static calculateWorkload(input: FacultyWorkloadInput): FacultyWorkloadResult {
    // 1. Teaching Hours Score (Max 34 points, 18 hrs = 34 pts)
    const teachingScore = Math.min(34, Math.round((input.teachingHours / 18) * 34));

    // 2. Student Load Score (Max 19 points, 186 students = 19 pts)
    const studentLoadScore = Math.min(19, Math.round((input.enrolledStudents / 186) * 19));

    // 3. Invigilation Duties Score (Max 14 points, 6 duties = 14 pts)
    const invigilationScore = Math.min(14, Math.round((input.invigilationDuties / 6) * 14));

    // 4. Research Projects Score (Max 8 points, 2 grants = 8 pts)
    const researchScore = Math.min(8, Math.round((input.researchProjects / 2) * 8));

    // 5. Administrative Roles Score (Max 12 points, 2 roles = 12 pts)
    const administrativeScore = Math.min(12, Math.round((input.administrativeRoles / 2) * 12));

    const totalScore = Math.min(100, teachingScore + studentLoadScore + invigilationScore + researchScore + administrativeScore);

    let status: "BALANCED" | "MODERATE" | "HIGH" | "OVERLOADED" = "BALANCED";
    if (totalScore > 80) status = "OVERLOADED";
    else if (totalScore > 70) status = "HIGH";
    else if (totalScore > 50) status = "MODERATE";

    const primaryCauses: string[] = [];
    const recommendations: string[] = [];

    if (input.teachingHours >= 16) {
      primaryCauses.push(`High teaching allocation (${input.teachingHours} hrs)`);
    }
    if (input.enrolledStudents >= 150) {
      primaryCauses.push(`Large student population (${input.enrolledStudents} students)`);
    }
    if (input.invigilationDuties >= 5) {
      primaryCauses.push(`Excess invigilation duties (${input.invigilationDuties} slots)`);
    }
    if (input.researchProjects >= 2) {
      primaryCauses.push(`Active research PI commitments (${input.researchProjects} projects)`);
    }
    if (input.administrativeRoles >= 2) {
      primaryCauses.push(`Multiple administrative roles (${input.administrativeRoles} roles)`);
    }

    if (status === "OVERLOADED" || status === "HIGH") {
      if (input.teachingHours >= 16) {
        recommendations.push("Redistribute one course section to an available qualified faculty member.");
      }
      if (input.invigilationDuties >= 5) {
        recommendations.push("Reduce invigilation duties to maximum threshold.");
      }
    } else {
      recommendations.push("Maintain current balanced faculty workload allocation.");
    }

    return {
      facultyId: input.facultyId,
      facultyName: input.facultyName,
      departmentCode: input.departmentCode,
      workloadScore: totalScore,
      status,
      breakdown: {
        teachingScore,
        studentLoadScore,
        invigilationScore,
        researchScore,
        administrativeScore,
        totalScore,
      },
      primaryCauses,
      recommendations,
    };
  }
}
