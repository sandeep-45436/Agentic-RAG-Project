import { WorldStateSnapshot } from "./world-state-manager";

export interface PolicyRule {
  id: string;
  name: string;
  category: "ATTENDANCE" | "COMMUNICATION" | "RBAC" | "ACADEMIC";
  conditionRegex?: string;
  minThreshold?: number;
  maxThreshold?: number;
  requiresApproval?: boolean;
  actionOnViolation: "BLOCK" | "REQUIRE_APPROVAL" | "WARN";
}

export interface PolicyEvaluation {
  isAllowed: boolean;
  violatedPolicies: string[];
  requiresApproval: boolean;
  recommendedAction?: string;
}

export class PolicyEngine {
  private static readonly DEFAULT_POLICIES: PolicyRule[] = [
    {
      id: "POL-001",
      name: "Minimum Exam Attendance Requirement",
      category: "ATTENDANCE",
      minThreshold: 75,
      actionOnViolation: "BLOCK",
    },
    {
      id: "POL-002",
      name: "Bulk Email Administrative Approval",
      category: "COMMUNICATION",
      maxThreshold: 500,
      requiresApproval: true,
      actionOnViolation: "REQUIRE_APPROVAL",
    },
    {
      id: "POL-003",
      name: "Grade Alteration Permission Check",
      category: "RBAC",
      actionOnViolation: "BLOCK",
    },
  ];

  public static evaluatePolicy(
    queryText: string,
    canonicalCode: string,
    worldState: WorldStateSnapshot
  ): PolicyEvaluation {
    const violatedPolicies: string[] = [];
    let isAllowed = true;
    let requiresApproval = false;
    let recommendedAction: string | undefined;

    const trimmed = queryText.toLowerCase();

    // Attendance policy rule check
    if (/\b(hall ticket|exam admit|exam eligibility|attendance|probation)\b/i.test(trimmed)) {
      const match = trimmed.match(/\b(\d{1,2})%/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val < 75) {
          violatedPolicies.push(`POL-001: Minimum Exam Attendance Requirement (75% required, found ${val}%)`);
          isAllowed = false;
          recommendedAction = `Attendance (${val}%) is below 75% threshold. Recommend advisor review & academic warning counseling.`;
        }
      }
    }

    // Bulk communication policy check
    if (/\b(email|notify|alert)\b/i.test(trimmed) && /\b(all students|mass|every student|[5-9]\d{2}|\d{4,})\b/i.test(trimmed)) {
      violatedPolicies.push("POL-002: Bulk Email Administrative Approval required for batch > 500");
      requiresApproval = true;
      recommendedAction = "Submit bulk dispatch payload for Department Head approval";
    }

    // RBAC policy check
    if (/\b(change grade|override mark)\b/i.test(trimmed) && worldState.activeUserContext.userRole !== "ADMIN") {
      violatedPolicies.push("POL-003: Grade Alteration Permission Check");
      isAllowed = false;
      recommendedAction = "Restrict grade modifications to authorized Registrar accounts";
    }

    return {
      isAllowed: isAllowed && violatedPolicies.length === 0,
      violatedPolicies,
      requiresApproval,
      ...(recommendedAction ? { recommendedAction } : {}),
    };
  }
}
