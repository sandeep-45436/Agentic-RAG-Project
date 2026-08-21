import { SubTask, RichCostEstimate } from "../graph/state";

export class ComplexityCalculator {
  public static calculateComplexity(
    agents: string[] = [],
    subTasks: SubTask[] = [],
    costEstimate?: Partial<RichCostEstimate>,
    isConversational: boolean = false
  ): "low" | "medium" | "high" {
    if (isConversational) {
      return "low";
    }

    const distinctAgents = new Set(agents).size;
    const totalResources =
      (costEstimate?.llmCalls ?? 0) +
      (costEstimate?.dbQueries ?? 0) +
      (costEstimate?.vectorSearches ?? 0);

    // Map subtask id to agent type
    const taskAgentMap = new Map<string, string>();
    for (const task of subTasks) {
      const agent =
        task.type === "KNOWLEDGE_LOOKUP"
          ? "KnowledgeAgent"
          : task.type === "DATABASE_QUERY"
          ? "DatabaseAgent"
          : "WorkflowAgent";
      taskAgentMap.set(task.id, agent);
    }

    // Check for cross-agent dependency edge
    let hasCrossAgentDependency = false;
    for (const task of subTasks) {
      const taskAgent = taskAgentMap.get(task.id);
      for (const depId of task.dependsOn || []) {
        const depAgent = taskAgentMap.get(depId);
        if (depAgent && taskAgent && depAgent !== taskAgent) {
          hasCrossAgentDependency = true;
          break;
        }
      }
      if (hasCrossAgentDependency) break;
    }

    // Algorithmic evaluation per Requirement 7
    if (distinctAgents >= 3 || hasCrossAgentDependency || totalResources >= 8) {
      return "high";
    }

    if (distinctAgents === 2 || (distinctAgents === 1 && totalResources >= 4 && totalResources <= 7)) {
      return "medium";
    }

    return "low";
  }
}
