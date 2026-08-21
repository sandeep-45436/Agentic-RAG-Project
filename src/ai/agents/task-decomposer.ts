import { v4 as uuidv4 } from "uuid";
import { SubTask } from "../graph/state";

export interface DependencySubTask extends SubTask {
  order: number;
  dependsOnSubTaskId?: string;
}

export class TaskDecomposer {
  public static decomposeGoal(
    goalText: string,
    subTaskInputs: Array<{
      id?: string;
      type: "KNOWLEDGE_LOOKUP" | "DATABASE_QUERY" | "WORKFLOW_EXECUTION" | "DOCUMENT_DELIVERY";
      query: string;
      dependsOn?: string[];
      graphTraversal?: boolean;
      outputKey?: string;
    }>
  ): DependencySubTask[] {
    const subTasks: DependencySubTask[] = [];
    let previousId: string | undefined = undefined;

    subTaskInputs.slice(0, 10).forEach((input, index) => {
      const currentId = input.id || uuidv4();

      // If explicit dependsOn is provided, use it; otherwise fallback to linear previousId
      const dependsOn = input.dependsOn
        ? input.dependsOn
        : previousId
        ? [previousId]
        : [];

      subTasks.push({
        id: currentId,
        order: index + 1,
        type: input.type,
        query: input.query.trim(),
        dependsOn,
        dependsOnSubTaskId: previousId,
        status: "pending",
        graphTraversal: input.graphTraversal ?? false,
        ...(input.outputKey ? { outputKey: input.outputKey } : {}),
      });

      previousId = currentId;
    });

    console.log(`[TaskDecomposer] Compiled ${subTasks.length} sub-tasks for goal: "${goalText}"`);
    return subTasks;
  }
}
