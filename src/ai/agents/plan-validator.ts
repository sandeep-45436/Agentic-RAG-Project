import { CognitivePlan } from "../graph/state";

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  checksRan: string[];
}

export class PlanValidator {
  public static validatePlan(plan: CognitivePlan): ValidationResult {
    const checksRan: string[] = [];
    const startTime = Date.now();

    if (!plan) {
      return PlanValidator.fail("plan_null_or_undefined", checksRan);
    }

    // Check 1: Goal validation
    checksRan.push("GoalValidation");
    if (!plan.goal || plan.goal.trim().length === 0) {
      return PlanValidator.fail("missing_goal", checksRan);
    }

    // Check 2: SubTask count bounds
    checksRan.push("SubTaskCountBounds");
    const subTasks = plan.subTasks || [];
    const isConversational = (plan.agents || []).length === 0 && subTasks.length === 0;
    if (!isConversational && (subTasks.length < 1 || subTasks.length > 10)) {
      return PlanValidator.fail("subtask_count_out_of_bounds", checksRan);
    }

    // Check 3: Agent Type validation
    checksRan.push("AgentTypeValidation");
    const validAgents = new Set(["KnowledgeAgent", "DatabaseAgent", "WorkflowAgent"]);
    for (const agent of plan.agents || []) {
      if (!validAgents.has(agent)) {
        return PlanValidator.fail("unknown_agent_type", checksRan);
      }
    }

    // Check 4: SubTask query validity
    checksRan.push("SubTaskQueryValidity");
    const subTaskMap = new Map<string, typeof subTasks[0]>();
    for (const task of subTasks) {
      if (!task.query || task.query.trim().length === 0) {
        return PlanValidator.fail("empty_subtask_query", checksRan);
      }
      subTaskMap.set(task.id, task);
    }

    // Check 5: Dangling dependency references & Cycle detection
    checksRan.push("DependencyIntegrityAndCycleDetection");
    const graph = new Map<string, string[]>();

    for (const task of subTasks) {
      const deps = task.dependsOn || [];
      graph.set(task.id, deps);

      for (const depId of deps) {
        if (!subTaskMap.has(depId)) {
          return PlanValidator.fail("dangling_dependency_reference", checksRan);
        }
      }
    }

    // DFS Cycle Detection
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const taskId of subTaskMap.keys()) {
      if (!visited.has(taskId)) {
        if (hasCycle(taskId)) {
          return PlanValidator.fail("circular_dependency", checksRan);
        }
      }
    }

    // Check 6: Cost estimate validation
    checksRan.push("CostEstimateValidation");
    if (plan.costEstimate) {
      const { llmCalls, dbQueries, vectorSearches } = plan.costEstimate;
      if (
        typeof llmCalls !== "number" || llmCalls < 0 ||
        typeof dbQueries !== "number" || dbQueries < 0 ||
        typeof vectorSearches !== "number" || vectorSearches < 0
      ) {
        return PlanValidator.fail("invalid_cost_estimate", checksRan);
      }
    }

    // Plan passed all checks!
    plan.orchestrationReady = true;
    plan.validationReport = {
      isValid: true,
      checksRan,
    };

    const durationMs = Date.now() - startTime;
    if (durationMs > 20) {
      console.warn(`[PlanValidator] Validation exceeded 20ms threshold: ${durationMs}ms`);
    }

    return {
      isValid: true,
      checksRan,
    };
  }

  private static fail(reason: string, checksRan: string[]): ValidationResult {
    const event = {
      event: "PLAN_VALIDATION_FAILED",
      reason,
      checksRan,
      timestamp: new Date().toISOString(),
    };
    console.log(JSON.stringify(event));

    return {
      isValid: false,
      reason,
      checksRan,
    };
  }
}
