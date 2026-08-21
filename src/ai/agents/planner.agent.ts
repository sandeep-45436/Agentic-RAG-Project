import { GraphState, CognitivePlan } from "../graph/state";
import { llm } from "@/ai/llm/openrouter";
import { ToolRegistry, Role } from "@/ai/tools/tool-registry";
import { PlannerBoundaryAuditor } from "./planner-boundary";
import { TaskDecomposer, DependencySubTask } from "./task-decomposer";
import { getMessageText } from "@/lib/utils";
import { z } from "zod";

const SubTaskSchema = z.object({
  type: z.enum(["KNOWLEDGE_LOOKUP", "DATABASE_QUERY", "WORKFLOW_EXECUTION", "DOCUMENT_DELIVERY"]),
  query: z.string().min(1, "Sub-task query cannot be empty"),
});

const PlanSchema = z.object({
  goal: z.string().min(1, "Goal description is required"),
  complexity: z.enum(["low", "medium", "high"]).optional().default("medium"),
  subTasks: z.array(SubTaskSchema).min(1, "At least one sub-task is required").max(5, "Maximum 5 sub-tasks allowed"),
});

/**
 * Planner Agent Node (Phase 3 Chapters 3.6 - 3.10 Specification):
 * Decomposes complex goals into ordered sub-task DAGs with dependency pointers.
 */
export async function plannerAgent(state: typeof GraphState.State) {
  const { messages, queryAnalysis, plan: existingPlan, userRole } = state;
  const latestMessage = messages[messages.length - 1];

  if (!latestMessage) {
    return {
      plan: null,
      routedPath: "KNOWLEDGE" as const,
    };
  }

  const userQuery = getMessageText(latestMessage).trim();

  if (queryAnalysis?.isConversational) {
    console.log("[PlannerAgent] Conversational intent detected. Fast-path routing to MEMORY.");
    return {
      plan: {
        goal: userQuery,
        complexity: "low" as const,
        agents: ["MemoryAgent", "ResponseAgent"],
        tools: [],
        subTasks: [],
        currentStepIndex: 0,
        isComplete: true,
      },
      routedPath: "MEMORY" as const,
    };
  }

  // Fast-path sub-200ms single-step DAG routing for standard retrieval and DB lookup
  const category = queryAnalysis?.intentCategory;
  if (category === "INFORMATION_RETRIEVAL" || category === "STRUCTURED_DATA_QUERY") {
    const isDb = category === "STRUCTURED_DATA_QUERY";
    const subTaskType = isDb ? "DATABASE_QUERY" : "KNOWLEDGE_LOOKUP";
    const agentName = isDb ? "DatabaseAgent" : "KnowledgeAgent";
    const toolName = isDb ? "university_database_query" : "knowledge_retrieval";
    const targetPath = isDb ? ("DATABASE" as const) : ("KNOWLEDGE" as const);

    const subTasks = TaskDecomposer.decomposeGoal(userQuery, [
      { type: subTaskType, query: queryAnalysis?.rewrittenQuery || userQuery },
    ]);

    console.log(`[PlannerAgent] Fast-path sub-200ms routing to ${targetPath}.`);
    return {
      plan: {
        goal: userQuery,
        complexity: "low" as const,
        agents: [agentName],
        tools: [toolName],
        subTasks,
        currentStepIndex: 0,
        isComplete: false,
      },
      routedPath: targetPath,
    };
  }

  // Fast-path for document delivery requests
  if (category === "DOCUMENT_DELIVERY") {
    const subTasks = TaskDecomposer.decomposeGoal(userQuery, [
      { type: "DOCUMENT_DELIVERY", query: queryAnalysis?.rewrittenQuery || userQuery },
    ]);

    console.log(`[PlannerAgent] Fast-path routing to DOCUMENT_DELIVERY.`);
    return {
      plan: {
        goal: userQuery,
        complexity: "low" as const,
        agents: ["DocumentDeliveryAgent"],
        tools: ["document_delivery"],
        subTasks,
        currentStepIndex: 0,
        isComplete: false,
      },
      routedPath: "DOCUMENT_DELIVERY" as const,
    };
  }

  const activeRole: Role = userRole || "ADMIN";
  const authorizedTools = ToolRegistry.getToolsForRole(activeRole);
  const toolDescriptions = authorizedTools.map((t) => `- ${t.name}: ${t.description}`).join("\n");

  const hasFailedTask = existingPlan?.subTasks.some((st) => st.status === "failed");
  const isReplanning = hasFailedTask && existingPlan && existingPlan.subTasks.length < 5;

  try {
    const prompt = isReplanning
      ? `
You are an Enterprise AI Cognitive Planner performing Adaptive Re-Planning.
The previous plan encountered a sub-task failure. Formulate a revised recovery sub-task.

Original Goal: "${existingPlan.goal}"
Failed Sub-Task: "${existingPlan.subTasks.find((st) => st.status === "failed")?.query}"

Authorized Tools for User Role (${activeRole}):
${toolDescriptions}

Return ONLY a valid JSON object matching this schema:
{
  "goal": "${existingPlan.goal}",
  "complexity": "medium",
  "subTasks": [
    {
      "type": "KNOWLEDGE_LOOKUP" | "DATABASE_QUERY" | "WORKFLOW_EXECUTION",
      "query": "revised query to fulfill the goal"
    }
  ]
}
`
      : `
You are an Enterprise AI Cognitive Planner for Smart University Operations.
Analyze the user request and generate a structured sub-task execution plan.

User Query: "${userQuery}"

Authorized Tools for User Role (${activeRole}):
${toolDescriptions}

Sub-Task Types:
1. "KNOWLEDGE_LOOKUP": Search handbooks, policy rules, or syllabi.
2. "DATABASE_QUERY": Search student GPAs, tuition balances, course catalogs, faculty workloads.
3. "WORKFLOW_EXECUTION": Execute advising alerts, transcript PDFs, or background jobs.

Return ONLY a valid JSON object matching the JSON schema below. Do not wrap in markdown code blocks (\`\`\`json).

JSON Schema:
{
  "goal": "summary of main goal",
  "complexity": "low" | "medium" | "high",
  "subTasks": [
    {
      "type": "KNOWLEDGE_LOOKUP" | "DATABASE_QUERY" | "WORKFLOW_EXECUTION",
      "query": "specific search or query text for this sub-task"
    }
  ]
}
`;

    console.log(`[PlannerAgent] Categorizing query & compiling plan for role '${activeRole}'...`);
    const response = await llm.invoke(prompt);
    const content = response.content.toString().trim();
    const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const validatedPlan = PlanSchema.parse(parsed);

    // Use TaskDecomposer to create sub-tasks with dependency pointers
    const subTasks: DependencySubTask[] = TaskDecomposer.decomposeGoal(
      validatedPlan.goal,
      validatedPlan.subTasks
    );

    const selectedAgents = new Set<string>();
    const selectedTools = new Set<string>();

    subTasks.forEach((st) => {
      if (st.type === "KNOWLEDGE_LOOKUP") {
        selectedAgents.add("KnowledgeAgent");
        selectedTools.add("knowledge_retrieval");
      } else if (st.type === "DATABASE_QUERY") {
        selectedAgents.add("DatabaseAgent");
        selectedTools.add("university_database_query");
      } else if (st.type === "WORKFLOW_EXECUTION") {
        selectedAgents.add("WorkflowAgent");
        selectedTools.add("workflow_action_execution");
      }
    });

    const plan: CognitivePlan = {
      goal: validatedPlan.goal,
      complexity: validatedPlan.complexity,
      agents: Array.from(selectedAgents),
      tools: Array.from(selectedTools),
      subTasks,
      currentStepIndex: 0,
      isComplete: false,
    };

    PlannerBoundaryAuditor.validatePlan(plan);

    const firstTaskType = subTasks[0].type;
    let nextPath: "KNOWLEDGE" | "DATABASE" | "WORKFLOW" = "KNOWLEDGE";
    if (firstTaskType === "DATABASE_QUERY") nextPath = "DATABASE";
    if (firstTaskType === "WORKFLOW_EXECUTION") nextPath = "WORKFLOW";

    console.log(`[PlannerAgent] Plan compiled & audited! Complexity: ${plan.complexity}, Agents: [${plan.agents?.join(", ")}], Tools: [${plan.tools?.join(", ")}]. Next route: ${nextPath}`);

    return {
      plan,
      routedPath: nextPath,
    };
  } catch (error) {
    console.warn("[PlannerAgent] Structured planning failed or boundary violation detected. Falling back to single-step Knowledge Lookup:", error);
  }

  // Safe fallback plan using TaskDecomposer
  const fallbackSubTasks = TaskDecomposer.decomposeGoal(userQuery, [
    { type: "KNOWLEDGE_LOOKUP", query: userQuery },
  ]);

  return {
    plan: {
      goal: userQuery,
      complexity: "low" as const,
      agents: ["KnowledgeAgent"],
      tools: ["knowledge_retrieval"],
      subTasks: fallbackSubTasks,
      currentStepIndex: 0,
      isComplete: false,
    },
    routedPath: "KNOWLEDGE" as const,
  };
}
