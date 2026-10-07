import { WorldStateSnapshot } from "./world-state-manager";

export interface PolicyRule {
  id: string;
  name: string;
  category: "PREREQUISITE" | "COMMUNICATION" | "RBAC" | "CREDIT_LOAD" | "ACADEMIC";
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
      name: "Mandatory Course Prerequisite Verification",
      category: "PREREQUISITE",
      actionOnViolation: "BLOCK",
    },
    {
      id: "POL-002",
      name: "Bulk Communication Administrative Approval",
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
    {
      id: "POL-004",
      name: "Semester Overload Credit Permission",
      category: "CREDIT_LOAD",
      maxThreshold: 26,
      actionOnViolation: "REQUIRE_APPROVAL",
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

    // 1. Credit overload policy check (> 26 credits requires Dean approval)
    if (/\b(credits?|course load|overload)\b/i.test(trimmed)) {
      const match = trimmed.match(/\b(\d{2})\s*credits?\b/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > 26) {
          violatedPolicies.push(`POL-004: Semester Overload Credit Permission (max 26 credits, requested ${val})`);
          requiresApproval = true;
          recommendedAction = `Course registration load of ${val} credits exceeds standard limit (26 credits). Requires Dean of Academic Affairs sign-off.`;
        }
      }
    }

    // 2. Prerequisite bypass attempt
    if (/\b(skip|bypass|waive|override)\b.*\b(prerequisite|prereq)\b/i.test(trimmed)) {
      if (worldState.activeUserContext.userRole !== "ADMIN" && worldState.activeUserContext.userRole !== "FACULTY") {
        violatedPolicies.push("POL-001: Mandatory Course Prerequisite Verification");
        isAllowed = false;
        recommendedAction = "Prerequisite waiver requests must be approved by the Department Academic Committee.";
      }
    }

    // 3. Bulk communication policy check
    if (/\b(email|notify|alert)\b/i.test(trimmed) && /\b(all students|mass|every student|[5-9]\d{2}|\d{4,})\b/i.test(trimmed)) {
      violatedPolicies.push("POL-002: Bulk Email Administrative Approval required for batch > 500");
      requiresApproval = true;
      recommendedAction = "Submit bulk dispatch payload for Department Head approval";
    }

    // 4. RBAC policy check for grade alterations
    if (/\b(change grade|override mark|update result)\b/i.test(trimmed) && worldState.activeUserContext.userRole !== "ADMIN") {
      violatedPolicies.push("POL-003: Grade Alteration Permission Check");
      isAllowed = false;
      recommendedAction = "Grade modifications restricted strictly to authorized Registrar/Dean accounts";
    }

    return {
      isAllowed: isAllowed && violatedPolicies.length === 0,
      violatedPolicies,
      requiresApproval,
      ...(recommendedAction ? { recommendedAction } : {}),
    };
  }
}
