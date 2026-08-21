/**
 * Exam Eligibility Engine — deterministic evaluation of exam eligibility.
 * Rules from Policy Engine POL-001: Attendance >= 75% required.
 */

export interface ExamEligibilityResult {
  studentId: string;
  studentName: string;
  studentNumber: string;
  isEligible: boolean;
  attendancePercentage: number;
  requiredPercentage: number; // 75% per POL-001
  shortfallClasses: number;
  feesClear: boolean;
  blockingReasons: string[];
  recommendations: string[];
}

export class ExamEligibilityEngine {
  private static readonly REQUIRED_ATTENDANCE = 75.0;

  /**
   * Evaluates a single student's exam eligibility based on their full profile.
   */
  static evaluate(studentProfile: any): ExamEligibilityResult {
    const name = studentProfile?.user?.name || studentProfile?.studentNumber || "Student";
    const studentNumber = studentProfile?.studentNumber || "N/A";
    const blockingReasons: string[] = [];
    const recommendations: string[] = [];

    // 1. Attendance Check
    const attendanceRecords = studentProfile?.attendanceRecords || [];
    let lowestPercentage = 100.0;
    let totalShortfall = 0;

    for (const record of attendanceRecords) {
      const pct = record.percentage ?? 100.0;
      if (pct < lowestPercentage) lowestPercentage = pct;
      if (pct < ExamEligibilityEngine.REQUIRED_ATTENDANCE) {
        const total = record.totalClasses || 40;
        const attended = record.attendedClasses || Math.round((pct / 100) * total);
        const needed = Math.ceil((ExamEligibilityEngine.REQUIRED_ATTENDANCE / 100) * total) - attended;
        if (needed > totalShortfall) totalShortfall = needed;
      }
    }

    if (lowestPercentage < ExamEligibilityEngine.REQUIRED_ATTENDANCE) {
      blockingReasons.push(
        `Attendance ${lowestPercentage.toFixed(1)}% is below the required ${ExamEligibilityEngine.REQUIRED_ATTENDANCE}% threshold (POL-001)`
      );
      recommendations.push(
        `Attend ${totalShortfall} additional classes to reach the minimum attendance requirement`
      );
      recommendations.push("Apply for attendance condonation if medical/extenuating circumstances apply");
    }

    // 2. Financial Check
    const financialAccounts = studentProfile?.financialAccounts || [];
    let feesClear = true;
    for (const account of financialAccounts) {
      if (account.status === "Overdue" || (account.balanceOutstanding && account.balanceOutstanding > 0)) {
        feesClear = false;
        blockingReasons.push(
          `Outstanding fee balance: $${account.balanceOutstanding?.toFixed(2) || "unknown"} (Status: ${account.status})`
        );
        recommendations.push("Clear outstanding dues at the finance office before exam registration deadline");
        break;
      }
    }

    // 3. Academic Status Check
    if (studentProfile?.academicStatus === "Suspended") {
      blockingReasons.push("Student is currently under academic/disciplinary suspension");
      recommendations.push("Contact the Dean of Students office for reinstatement procedures");
    }

    const isEligible = blockingReasons.length === 0;

    if (isEligible) {
      recommendations.push("Student is eligible for exams. No action required.");
    }

    return {
      studentId: studentProfile?.id || "unknown",
      studentName: name,
      studentNumber,
      isEligible,
      attendancePercentage: lowestPercentage,
      requiredPercentage: ExamEligibilityEngine.REQUIRED_ATTENDANCE,
      shortfallClasses: totalShortfall,
      feesClear,
      blockingReasons,
      recommendations,
    };
  }

  /**
   * Batch evaluates multiple student profiles for exam eligibility.
   */
  static evaluateBatch(studentProfiles: any[]): ExamEligibilityResult[] {
    return studentProfiles.map((profile) => ExamEligibilityEngine.evaluate(profile));
  }

  /**
   * Filters batch results to return only ineligible students.
   */
  static getIneligibleStudents(studentProfiles: any[]): ExamEligibilityResult[] {
    return ExamEligibilityEngine.evaluateBatch(studentProfiles).filter((r) => !r.isEligible);
  }
}
