import { GraphState } from "../graph/state";
import { getMessageText } from "@/lib/utils";

/**
 * Workflow Agent Node: Handles external API tools, background job triggers, and serverless workflow execution.
 */
export async function workflowAgent(state: typeof GraphState.State) {
  const { messages, plan } = state;
  const latestMessage = messages[messages.length - 1];

  if (!latestMessage) {
    return { toolOutputs: [] };
  }

  let queryText = getMessageText(latestMessage);
  if (plan && plan.subTasks && plan.subTasks[plan.currentStepIndex]) {
    queryText = plan.subTasks[plan.currentStepIndex].query;
  }

  console.log(`[WorkflowAgent] Executing workflow step for query: "${queryText}"`);

  // Mock tool execution return for safety and zero side-effects
  const toolResult = {
    toolName: "WorkflowAction",
    result: {
      status: "success",
      executedQuery: queryText,
      timestamp: new Date().toISOString(),
    },
  };

  return {
    toolOutputs: [toolResult],
  };
}
