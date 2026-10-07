/**
 * Legacy Exam Eligibility Engine — Refactored to Academic Standing & Registration Status.
 * Note: Attendance and Hall Tickets are removed from application policy.
 * For Degree and Course audits, use AcademicDecisionEngine.
 */

export interface ExamEligibilityResult {
  studentId: string;
  studentName: string;
  studentNumber: string;
  isEligible: boolean;
  attendancePercentage: number;
  requiredPercentage: number;
  shortfallClasses: number;
  feesClear: boolean;
  blockingReasons: string[];
  recommendations: string[];
}

export class ExamEligibilityEngine {
  private static readonly REQUIRED_ATTENDANCE = 0.0; // Attendance gate deactivated

  /**
   * Evaluates student eligibility based strictly on academic standing and fee clearance.
   */
  static evaluate(studentProfile: any): ExamEligibilityResult {
    const name = studentProfile?.user?.name || studentProfile?.studentNumber || "Student";
    const studentNumber = studentProfile?.studentNumber || "N/A";
    const blockingReasons: string[] = [];
    const recommendations: string[] = [];

    // 1. Financial Check
    const financialAccounts = studentProfile?.financialAccounts || [];
    let feesClear = true;
    for (const account of financialAccounts) {
      if (account.status === "Overdue" || (account.balanceOutstanding && account.balanceOutstanding > 0)) {
        feesClear = false;
        blockingReasons.push(
          `Outstanding fee balance: ₹${account.balanceOutstanding?.toFixed(2) || "unknown"} (Status: ${account.status})`
        );
        recommendations.push("Clear outstanding dues at the finance office");
        break;
      }
    }

    // 2. Academic Status Check
    if (studentProfile?.academicStatus === "Suspended") {
      blockingReasons.push("Student is currently under academic/disciplinary suspension");
      recommendations.push("Contact the Dean of Students office for reinstatement procedures");
    }

    const isEligible = blockingReasons.length === 0;

    if (isEligible) {
      recommendations.push("Student is in good academic standing. No blocking holds found.");
    }

    return {
      studentId: studentProfile?.id || "unknown",
      studentName: name,
      studentNumber,
      isEligible,
      attendancePercentage: 100.0,
      requiredPercentage: 0.0,
      shortfallClasses: 0,
      feesClear,
      blockingReasons,
      recommendations,
    };
  }

  /**
   * Batch evaluates multiple student profiles.
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
