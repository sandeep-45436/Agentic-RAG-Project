/**
 * Academic Decision Engine — Deterministic evaluation of academic progression,
 * course prerequisites, degree credit audits, and graduation eligibility.
 * 
 * Rules are derived directly from the AcademicPolicyCache.
 * Deterministic code executes all logic, credit math, and threshold gates.
 * The LLM only interprets and articulates the resulting verified report.
 */

import { AcademicPolicyCache } from "../cag/academic-policy-cache";

export interface PrerequisiteCheckResult {
  studentId: string;
  targetCourseCode: string;
  isEligible: boolean;
  requiredPrerequisites: string[];
  completedPrerequisites: string[];
  missingPrerequisites: string[];
  blockingReason?: string;
  recommendations: string[];
}

export interface DegreeAuditResult {
  studentId: string;
  studentNumber: string;
  totalCreditsEarned: number;
  totalCreditsRequired: number;
  creditsRemaining: number;
  currentCgpa: number;
  isDegreeEligible: boolean;
  isHonoursEligible: boolean;
  creditDeficits: {
    coreDeficit: number;
    electiveDeficit: number;
  };
  graduationStatus: "GRADUATED_ELIGIBLE" | "IN_PROGRESS" | "CREDIT_DEFICIT" | "ACADEMIC_PROBATION";
  blockingReasons: string[];
  recommendations: string[];
}

export interface CourseGradeEntry {
  courseCode: string;
  credits: number;
  grade: string;
}

export class AcademicDecisionEngine {
  /**
   * Deterministically verifies if a student has completed all required prerequisites
   * for a target course section.
   */
  public static verifyPrerequisites(
    studentId: string,
    targetCourseCode: string,
    requiredPrereqs: string[],
    completedCoursesWithGrades: Map<string, string> // courseCode -> grade
  ): PrerequisiteCheckResult {
    const missing: string[] = [];
    const completed: string[] = [];
    const recommendations: string[] = [];

    for (const prereq of requiredPrereqs) {
      const grade = completedCoursesWithGrades.get(prereq.toUpperCase());
      if (!grade || grade === "F" || grade === "Incomplete" || grade === "Dropped") {
        missing.push(prereq);
      } else {
        completed.push(prereq);
      }
    }

    const isEligible = missing.length === 0;
    let blockingReason: string | undefined;

    if (!isEligible) {
      blockingReason = `Prerequisite requirement unmet. Missing or unpassed mandatory course(s): ${missing.join(", ")}.`;
      recommendations.push(
        `Enroll in and successfully pass prerequisite course(s) [${missing.join(", ")}] before registering for ${targetCourseCode}.`
      );
      recommendations.push("Consult your academic faculty advisor if seeking an exceptional waiver.");
    } else {
      recommendations.push(`Prerequisites cleared. Student is eligible to enroll in ${targetCourseCode}.`);
    }

    return {
      studentId,
      targetCourseCode,
      isEligible,
      requiredPrerequisites: requiredPrereqs,
      completedPrerequisites: completed,
      missingPrerequisites: missing,
      blockingReason,
      recommendations,
    };
  }

  /**
   * Deterministically audits a student's transcript against B.Tech graduation criteria.
   */
  public static auditDegreeCredits(
    studentId: string,
    studentNumber: string,
    enrolments: Array<{ courseCode: string; credits: number; grade: string | null; status: string; isCore?: boolean }>,
    currentCgpa: number,
    historicalBacklogsCount: number = 0
  ): DegreeAuditResult {
    const rules = AcademicPolicyCache.BTECH_DEGREE_REQUIREMENTS;
    const blockingReasons: string[] = [];
    const recommendations: string[] = [];

    let totalEarned = 0;
    let coreEarned = 0;
    let electiveEarned = 0;

    for (const enr of enrolments) {
      const isPassing = enr.status === "Completed" && enr.grade && enr.grade !== "F";
      if (isPassing) {
        totalEarned += enr.credits;
        if (enr.isCore) {
          coreEarned += enr.credits;
        } else {
          electiveEarned += enr.credits;
        }
      }
    }

    const creditsRemaining = Math.max(0, rules.totalCreditsRequired - totalEarned);
    const coreDeficit = Math.max(0, rules.coreCreditsRequired - coreEarned);
    const electiveDeficit = Math.max(0, (rules.totalCreditsRequired - rules.coreCreditsRequired) - electiveEarned);

    // Graduation threshold check
    if (totalEarned < rules.totalCreditsRequired) {
      blockingReasons.push(
        `Total credit deficit: Completed ${totalEarned} of ${rules.totalCreditsRequired} required credits (${creditsRemaining} credits remaining).`
      );
    }

    if (coreDeficit > 0) {
      blockingReasons.push(
        `Mandatory core credit deficit: Completed ${coreEarned} of ${rules.coreCreditsRequired} required core credits.`
      );
    }

    if (currentCgpa < rules.minCgpaForDegree) {
      blockingReasons.push(
        `Cumulative GPA shortfall: Current CGPA ${currentCgpa.toFixed(2)} is below the minimum graduation threshold of ${rules.minCgpaForDegree.toFixed(2)}.`
      );
    }

    // Honours criteria check
    const isHonoursEligible =
      totalEarned >= rules.totalCreditsRequired &&
      currentCgpa >= rules.minCgpaForHonours &&
      historicalBacklogsCount === 0;

    const isDegreeEligible = blockingReasons.length === 0;

    let status: DegreeAuditResult["graduationStatus"] = "IN_PROGRESS";
    if (isDegreeEligible) {
      status = "GRADUATED_ELIGIBLE";
      recommendations.push("All graduation and credit criteria satisfied. Eligible for degree conferral.");
      if (isHonoursEligible) {
        recommendations.push("Student satisfies B.Tech Honours distinction criteria (CGPA >= 8.0, zero backlogs).");
      }
    } else if (currentCgpa < 5.0) {
      status = "ACADEMIC_PROBATION";
      recommendations.push("Schedule mandatory academic counseling to formulate a CGPA improvement study plan.");
    } else {
      status = "CREDIT_DEFICIT";
      recommendations.push(`Register for remaining ${creditsRemaining} credits across subsequent academic semesters.`);
    }

    return {
      studentId,
      studentNumber,
      totalCreditsEarned: totalEarned,
      totalCreditsRequired: rules.totalCreditsRequired,
      creditsRemaining,
      currentCgpa,
      isDegreeEligible,
      isHonoursEligible,
      creditDeficits: {
        coreDeficit,
        electiveDeficit,
      },
      graduationStatus: status,
      blockingReasons,
      recommendations,
    };
  }

  /**
   * Deterministically calculates CGPA from credit-weighted grade points.
   */
  public static calculateCgpa(grades: CourseGradeEntry[]): number {
    const pointMap = new Map<string, number>(
      AcademicPolicyCache.GRADING_TIERS.map((t) => [t.grade, t.gradePoints])
    );

    let totalPoints = 0;
    let totalCredits = 0;

    for (const g of grades) {
      const points = pointMap.get(g.grade.toUpperCase()) ?? 0;
      totalPoints += points * g.credits;
      totalCredits += g.credits;
    }

    if (totalCredits === 0) return 0.0;
    return Math.round((totalPoints / totalCredits) * 100) / 100;
  }
}
