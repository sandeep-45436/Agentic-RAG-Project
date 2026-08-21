import { CognitivePlan, SubTask } from "../graph/state";

export interface OptimizationResult {
  optimizedPlan: CognitivePlan;
  subtasksRemoved: number;
  agentsPruned: number;
  passesExecuted: string[];
}

export class PlanOptimizer {
  public static optimizePlan(plan: CognitivePlan): OptimizationResult {
    let subtasksRemoved = 0;
    let agentsPruned = 0;
    const passesExecuted: string[] = [];

    // Copy plan structure
    const copySubTasks: SubTask[] = JSON.parse(JSON.stringify(plan.subTasks || []));
    const uniqueSubTasks: SubTask[] = [];
    const idMapping: Record<string, string> = {};
    const seenMap = new Map<string, string>(); // key -> id

    // Pass 1: Subtask Deduplication
    passesExecuted.push("SubtaskDeduplicationPass");
    for (const task of copySubTasks) {
      const normalizedQuery = task.query.trim().toLowerCase();
      const dedupKey = `${task.type}:${normalizedQuery}`;

      if (seenMap.has(dedupKey)) {
        const existingId = seenMap.get(dedupKey)!;
        idMapping[task.id] = existingId;
        subtasksRemoved++;
      } else {
        seenMap.set(dedupKey, task.id);
        uniqueSubTasks.push(task);
      }
    }

    // Remap dependsOn arrays to surviving task IDs and filter out self-dependencies
    for (const task of uniqueSubTasks) {
      if (task.dependsOn && Array.isArray(task.dependsOn)) {
        const remapped = task.dependsOn
          .map((depId) => idMapping[depId] || depId)
          .filter((depId) => depId !== task.id);
        // Deduplicate dependsOn list
        task.dependsOn = Array.from(new Set(remapped));
      }
    }

    // Pass 2: Unused Agent & Tool Pruning
    passesExecuted.push("AgentPruningPass");
    const activeAgents = new Set<string>();
    const activeTools = new Set<string>();

    for (const task of uniqueSubTasks) {
      if (task.type === "KNOWLEDGE_LOOKUP") {
        activeAgents.add("KnowledgeAgent");
        activeTools.add("knowledge_retrieval");
      } else if (task.type === "DATABASE_QUERY") {
        activeAgents.add("DatabaseAgent");
        activeTools.add("university_database_query");
      } else if (task.type === "WORKFLOW_EXECUTION") {
        activeAgents.add("WorkflowAgent");
        activeTools.add("workflow_action_execution");
      }
    }

    const initialAgentCount = (plan.agents || []).length;
    const prunedAgents = Array.from(activeAgents);
    if (initialAgentCount > prunedAgents.length) {
      agentsPruned = initialAgentCount - prunedAgents.length;
    }

    const optimizedPlan: CognitivePlan = {
      ...plan,
      agents: prunedAgents,
      tools: Array.from(activeTools),
      subTasks: uniqueSubTasks,
      optimizationSummary: {
        subtasksRemoved,
        agentsPruned,
        passesExecuted,
      },
    };

    return {
      optimizedPlan,
      subtasksRemoved,
      agentsPruned,
      passesExecuted,
    };
  }
}
