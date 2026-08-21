import { CognitivePlan } from "../graph/state";

export interface SimulationReport {
  estimatedLatencyMs: number;
  estimatedTokens: number;
  estimatedCostUSD: number;
  simulationConfidence: number;
  requiresApproval: boolean;
  approvalReason?: string;
}

export class ExecutionSimulator {
  public static simulate(plan: CognitivePlan): SimulationReport {
    const cost = plan.costEstimate;
    const subTaskCount = plan.subTasks.length;

    const llmCalls = cost?.llmCalls ?? 1;
    const dbQueries = cost?.dbQueries ?? 0;
    const vectorSearches = cost?.vectorSearches ?? 0;

    const estimatedLatencyMs = (llmCalls * 250) + (dbQueries * 80) + (vectorSearches * 120);
    const estimatedTokens = (llmCalls * 350) + (subTaskCount * 100);
    const estimatedCostUSD = (estimatedTokens / 1000) * 0.00015;

    const requiresApproval = subTaskCount > 5 || (cost?.workflowCalls ?? 0) > 0;
    const approvalReason = requiresApproval ? "Plan complexity or workflow action requires administrative signoff" : undefined;

    return {
      estimatedLatencyMs,
      estimatedTokens,
      estimatedCostUSD,
      simulationConfidence: 0.94,
      requiresApproval,
      ...(approvalReason ? { approvalReason } : {}),
    };
  }
}
