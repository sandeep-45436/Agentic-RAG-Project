import { PolicyEngine } from "@/ai/kernel/policy-engine";

export interface BlockingReason {
  code: "ATTENDANCE" | "FEE_HOLD" | "INTERNAL_MARKS" | "DISCIPLINARY" | "POLICY" | "OTHER";
  severity: "BLOCKING" | "WARNING";
  actualValue?: number;
  requiredValue?: number;
  description: string;
  policyCitationIds: string[];
}

export interface HallTicketDecision {
  studentId: string;
  examinationId: string;
  status: "ELIGIBLE" | "BLOCKED" | "CONDITIONAL" | "REQUIRES_APPROVAL";
  attendanceEligible: boolean;
  marksEligible: boolean;
  feeEligible: boolean;
  disciplinaryEligible: boolean;
  blockingReasons: BlockingReason[];
  policyReferences: string[];
  recommendations: string[];
  requiresApproval: boolean;
  evaluatedAt: string;
}

export interface StudentExaminationProfile {
  studentId: string;
  studentNumber: string;
  name: string;
  academicStatus: string;
  attendancePercentage: number;
  outstandingBalance: number;
  internalMarksComplete: boolean;
  internalMarksAverage?: number;
}

export class HallTicketEngine {
  /**
   * Deterministically evaluates student examination eligibility.
   * LLM never decides eligibility; this deterministic engine evaluates rules.
   */
  public static evaluateEligibility(
    profile: StudentExaminationProfile,
    examinationId: string,
    attendanceThreshold: number = 75.0
  ): HallTicketDecision {
    const blockingReasons: BlockingReason[] = [];
    const policyReferences: string[] = [];
    const recommendations: string[] = [];

    // 1. Attendance Rule Evaluation
    const attendanceEligible = profile.attendancePercentage >= attendanceThreshold;
    if (!attendanceEligible) {
      blockingReasons.push({
        code: "ATTENDANCE",
        severity: "BLOCKING",
        actualValue: profile.attendancePercentage,
        requiredValue: attendanceThreshold,
        description: `Attendance shortfall: ${profile.attendancePercentage.toFixed(1)}% is below the required ${attendanceThreshold}% threshold.`,
        policyCitationIds: ["POLICY_ATTENDANCE_REG_01"],
      });
      policyReferences.push("Academic Handbook Regulation 4.2: Minimum 75% attendance mandatory.");
      recommendations.push("Submit formal medical or attendance waiver application to Dean for review.");
    }

    // 2. Financial Balance Rule Evaluation
    const feeEligible = profile.outstandingBalance <= 0;
    if (!feeEligible) {
      blockingReasons.push({
        code: "FEE_HOLD",
        severity: "BLOCKING",
        actualValue: profile.outstandingBalance,
        requiredValue: 0,
        description: `Financial hold active: Outstanding tuition balance of ₹${profile.outstandingBalance.toLocaleString("en-IN")}.`,
        policyCitationIds: ["POLICY_FINANCE_REG_05"],
      });
      policyReferences.push("Bursar Financial Policy Section 2.1: Clear all tuition dues prior to exam registration.");
      recommendations.push("Clear pending dues at Finance Office or apply for installment approval.");
    }

    // 3. Internal Marks Rule Evaluation
    const marksEligible = profile.internalMarksComplete;
    if (!marksEligible) {
      blockingReasons.push({
        code: "INTERNAL_MARKS",
        severity: "BLOCKING",
        description: "Incomplete internal assessment marks or continuous evaluation records.",
        policyCitationIds: ["POLICY_ASSESSMENT_REG_03"],
      });
      policyReferences.push("Examination Rules 3.1: Internal assessment completion is mandatory.");
      recommendations.push("Contact course instructor to complete pending continuous assessment submissions.");
    }

    // 4. Disciplinary Status Evaluation
    const disciplinaryEligible = profile.academicStatus !== "Suspended";
    if (!disciplinaryEligible) {
      blockingReasons.push({
        code: "DISCIPLINARY",
        severity: "BLOCKING",
        description: `Academic status constraint: Student is currently under '${profile.academicStatus}' status.`,
        policyCitationIds: ["POLICY_CONDUCT_REG_09"],
      });
      policyReferences.push("Disciplinary Code Section 5: Suspended status revokes examination privileges.");
      recommendations.push("Contact Disciplinary Board for status reinstatement appeal.");
    } else if (profile.academicStatus === "Academic Probation") {
      blockingReasons.push({
        code: "POLICY",
        severity: "WARNING",
        description: "Student is on Academic Probation: Special advisor approval required.",
        policyCitationIds: ["POLICY_PROBATION_REG_04"],
      });
      recommendations.push("Obtain formal sign-off from Academic Advisor prior to hall ticket release.");
    }

    // Determine Final Status & Approval Flag
    let status: "ELIGIBLE" | "BLOCKED" | "CONDITIONAL" | "REQUIRES_APPROVAL" = "ELIGIBLE";
    let requiresApproval = false;

    const blockingCount = blockingReasons.filter((r) => r.severity === "BLOCKING").length;

    if (blockingCount === 0) {
      if (profile.academicStatus === "Academic Probation") {
        status = "REQUIRES_APPROVAL";
        requiresApproval = true;
      } else {
        status = "ELIGIBLE";
      }
    } else if (blockingCount === 1 && !attendanceEligible && profile.attendancePercentage >= 65.0) {
      // Conditional eligibility if attendance is between 65% and 75%
      status = "CONDITIONAL";
      requiresApproval = true;
      recommendations.push("Eligible for Dean Condonation Fee exception.");
    } else {
      status = "BLOCKED";
      requiresApproval = false;
    }

    return {
      studentId: profile.studentId,
      examinationId,
      status,
      attendanceEligible,
      marksEligible,
      feeEligible,
      disciplinaryEligible,
      blockingReasons,
      policyReferences,
      recommendations,
      requiresApproval,
      evaluatedAt: new Date().toISOString(),
    };
  }
}
