import { CognitivePlan } from "../graph/state";
import { PlanValidator } from "./plan-validator";

export class BoundaryViolationException extends Error {
  constructor(message: string) {
    super(`[PlannerBoundaryViolation] ${message}`);
    this.name = "BoundaryViolationException";
  }
}

/**
 * Planner Boundary Auditor:
 * Verifies that compiled Cognitive Plans strictly respect architectural boundaries.
 * Superseded by PlanValidator, retained for backward compatibility.
 */
export class PlannerBoundaryAuditor {
  public static validatePlan(plan: CognitivePlan): boolean {
    const result = PlanValidator.validatePlan(plan);
    if (!result.isValid) {
      throw new BoundaryViolationException(result.reason || "Plan validation failed");
    }
    return true;
  }
}
