/**
 * unifiedPlannerNode — Enterprise Cognitive Kernel Planning Gateway
 *
 * Delegates query analysis, policy evaluation, world state snapshotting,
 * predictive reasoning, execution simulation, and meta-reasoning to modular sub-systems.
 */

import {
  GraphState,
  SubTask,
  CognitivePlan,
  RichCostEstimate,
  ConfidenceBreakdown,
  ExecutionStrategy,
  FailureContext,
} from "@/ai/graph/state";
import { lightweightLlm } from "@/ai/llm/openrouter";
import { CacheLayer, CACHE_TTL } from "@/ai/cache/cache-layer";
import { StageTimer } from "@/ai/instrumentation/stage-timer";
import { TaskDecomposer } from "@/ai/agents/task-decomposer";
import { PlanOptimizer } from "@/ai/agents/plan-optimizer";
import { PlanValidator } from "@/ai/agents/plan-validator";
import { ComplexityCalculator } from "@/ai/utils/complexity-calculator";
import { CognitiveKernel } from "@/ai/kernel/cognitive-kernel";
import { PredictiveReasoner } from "@/ai/kernel/predictive-reasoner";
import { ExecutionSimulator } from "@/ai/kernel/execution-simulator";
import { MetaReasoner } from "@/ai/kernel/meta-reasoner";
import { getMessageText } from "@/lib/utils";

export interface UnifiedPlannerLLMResponse {
  isConversational: boolean;
  goalStatement: string;
  rewrittenQuery: string;
  variants: string[];
  entities: string[];
  costEstimate: {
    llmCalls: number;
    dbQueries: number;
    vectorSearches: number;
    workflowCalls?: number;
    graphTraversals?: number;
  };
  confidenceBreakdown: {
    overall: number;
    intent: number;
    entity: number;
    toolSelection: number;
    dependency: number;
  };
  subTasks: Array<{
    id: string;
    type: "KNOWLEDGE_LOOKUP" | "DATABASE_QUERY" | "WORKFLOW_EXECUTION" | "DOCUMENT_DELIVERY";
    query: string;
    dependsOn?: string[];
    graphTraversal?: boolean;
    outputKey?: string;
  }>;
}

const PRONOUN_RE = /\b(he|she|it|they|this|that|these|those)\b/i;

function routeFromSubTasks(
  subTasks: SubTask[]
): "KNOWLEDGE" | "DATABASE" | "WORKFLOW" | "MEMORY" | "COMBINED" | "DOCUMENT_DELIVERY" {
  if (!subTasks || subTasks.length === 0) return "MEMORY";

  const hasKnowledge = subTasks.some((t) => t.type === "KNOWLEDGE_LOOKUP");
  const hasDatabase = subTasks.some((t) => t.type === "DATABASE_QUERY");
  const hasDocumentDelivery = subTasks.some((t) => t.type === "DOCUMENT_DELIVERY");

  // Document delivery takes priority if explicitly requested
  if (hasDocumentDelivery) return "DOCUMENT_DELIVERY";

  // If both knowledge and database tasks exist, route to COMBINED
  if (hasKnowledge && hasDatabase) return "COMBINED";

  const firstType = subTasks[0]?.type;
  if (firstType === "DATABASE_QUERY") return "DATABASE";
  if (firstType === "WORKFLOW_EXECUTION") return "WORKFLOW";
  return "KNOWLEDGE";
}

function buildExecutionStrategy(subTasks: SubTask[]): ExecutionStrategy {
  const parallelGroups: string[][] = [];
  const sequentialGroups: string[][] = [];

  if (subTasks.length > 0) {
    const rootTasks = subTasks.filter((t) => !t.dependsOn || t.dependsOn.length === 0).map((t) => t.id);
    const dependentTasks = subTasks.filter((t) => t.dependsOn && t.dependsOn.length > 0).map((t) => t.id);

    if (rootTasks.length > 0) parallelGroups.push(rootTasks);
    if (dependentTasks.length > 0) sequentialGroups.push(dependentTasks);
  }

  return {
    parallelGroups,
    sequentialGroups,
    requiresVerification: true,
    requiresApproval: false,
    timeoutBudgetMs: 800,
    retryPolicy: { maxRetries: 2 },
  };
}

export async function generateRecoveryPlan(
  rawQuery: string,
  failureContext: FailureContext
): Promise<CognitivePlan | null> {
  console.log(`[UnifiedPlanner] Generating Recovery Plan for failed task ${failureContext.failedTaskId}`);

  const recoverySubTask: SubTask = {
    id: `recovery-task-1`,
    type: failureContext.failedTaskType === "DATABASE_QUERY" ? "KNOWLEDGE_LOOKUP" : "DATABASE_QUERY",
    query: `Alternative query for failed task: ${failureContext.attemptedQuery}`,
    status: "pending",
    dependsOn: [],
  };

  const costEstimate: RichCostEstimate = {
    llmCalls: 1,
    dbQueries: recoverySubTask.type === "DATABASE_QUERY" ? 1 : 0,
    vectorSearches: recoverySubTask.type === "KNOWLEDGE_LOOKUP" ? 1 : 0,
    workflowCalls: 0,
    graphTraversals: 0,
    estimatedLatencyMs: 250,
    estimatedTokens: 300,
    estimatedCostUSD: 0.0001,
    cacheHitProbability: 0,
  };

  const confidenceBreakdown: ConfidenceBreakdown = {
    overall: 0.70,
    intent: 0.80,
    entity: 0.80,
    toolSelection: 0.70,
    dependency: 0.90,
  };

  const agentName = recoverySubTask.type === "DATABASE_QUERY" ? "DatabaseAgent" : "KnowledgeAgent";

  const recoveryPlan: CognitivePlan = {
    goal: rawQuery,
    goalStatement: `Recovery plan for failed task ${failureContext.failedTaskId}`,
    normalizedGoal: "RECOVERY_EXECUTION",
    priority: "HIGH",
    reasoning: `Replanning triggered due to failure: ${failureContext.errorMessage}`,
    complexity: "low",
    agents: [agentName],
    tools: [recoverySubTask.type === "DATABASE_QUERY" ? "university_database_query" : "knowledge_retrieval"],
    subTasks: [recoverySubTask],
    currentStepIndex: 0,
    isComplete: false,
    costEstimate,
    confidence: 0.70,
    confidenceBreakdown,
    executionStrategy: buildExecutionStrategy([recoverySubTask]),
    failureContext,
  };

  const validation = PlanValidator.validatePlan(recoveryPlan);
  if (!validation.isValid) {
    console.error("[UnifiedPlanner] Recovery plan validation failed:", validation.reason);
    return null;
  }

  const recoveryEvent = {
    event: "RECOVERY_PLAN_GENERATED",
    recoverySubTaskCount: 1,
    failedTaskId: failureContext.failedTaskId,
    originalGoal: rawQuery,
    timestamp: new Date().toISOString(),
  };
  console.log(JSON.stringify(recoveryEvent));

  return recoveryPlan;
}

// ---------------------------------------------------------------------------
// Main Node
// ---------------------------------------------------------------------------

export async function unifiedPlannerNode(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  const stageStart = StageTimer.start("plannerNode");
  const { messages, organizationId, userId, userRole } = state;

  const latestMessage = messages[messages.length - 1];
  const rawQuery = latestMessage ? getMessageText(latestMessage).trim() : "";

  // 1. Cognitive Kernel Analysis (World Model, Policy Engine, Decision Memory)
  const kernelContext = CognitiveKernel.analyzeQuery(rawQuery, userId || "default-user", userRole || "ADMIN");
  const { recognizedGoal, normalizedGoal, intentResult } = kernelContext;
  const intentCategory = intentResult.category;

  // 2. Predictive Reasoner (Early Exit Circuit Breaker)
  const predictionResult = PredictiveReasoner.predictOutcome(kernelContext);

  if (predictionResult.earlyExitRecommended) {
    const earlyExitEvent = {
      event: "PREDICTIVE_EARLY_EXIT_TRIGGERED",
      predictedOutcome: predictionResult.predictedOutcome,
      intervention: predictionResult.recommendedIntervention,
      organizationId,
      userId,
      timestamp: new Date().toISOString(),
    };
    console.log(JSON.stringify(earlyExitEvent));

    const earlyExitPlan: CognitivePlan = {
      goal: rawQuery,
      goalStatement: recognizedGoal.objective,
      normalizedGoal,
      priority: recognizedGoal.priority,
      reasoning: predictionResult.recommendedIntervention,
      complexity: "low",
      agents: [],
      tools: [],
      subTasks: [],
      currentStepIndex: 0,
      isComplete: true,
      orchestrationReady: true,
      predictionResult,
    };

    const { durationMs } = StageTimer.end(
      "plannerNode",
      stageStart,
      { organizationId, userId, cacheHit: false },
      false
    );

    return {
      queryAnalysis: {
        isConversational: true,
        intentCategory,
        rewrittenQuery: rawQuery,
        variants: [],
        entities: recognizedGoal.entities,
        earlyExitIntervention: predictionResult.recommendedIntervention,
      },
      plan: earlyExitPlan,
      routedPath: "MEMORY",
      plannerFailed: false,
      timings: { plannerNode: durationMs, analysisNode: durationMs },
      finalPrompt: predictionResult.recommendedIntervention,
    };
  }

  const normalizedQuery = rawQuery.toLowerCase().replace(/\s+/g, " ").trim();
  let cacheHit = false;
  let plannerFailed = false;
  let errorOccurred = false;

  const shortContext = messages.length <= 2;
  const hasPronoun = PRONOUN_RE.test(rawQuery);
  const shouldSkipRewrite =
    (shortContext && !hasPronoun && (intentCategory !== ("INFORMATION_RETRIEVAL" as string) || intentResult.isFastPath)) ||
    intentCategory !== ("INFORMATION_RETRIEVAL" as string);

  const cacheKey = CacheLayer.planKey(normalizedQuery);
  const cachedPlan = CacheLayer.get<CognitivePlan>(cacheKey);

  let plan: CognitivePlan = {
    goal: rawQuery,
    goalStatement: recognizedGoal.objective,
    normalizedGoal,
    priority: recognizedGoal.priority,
    complexity: "low",
    agents: ["KnowledgeAgent"],
    tools: ["knowledge_retrieval"],
    subTasks: [
      {
        id: "task-1",
        type: "KNOWLEDGE_LOOKUP",
        query: rawQuery,
        status: "pending",
        dependsOn: [],
      },
    ],
    currentStepIndex: 0,
    isComplete: false,
  };

  if (cachedPlan !== null) {
    const validatedCache = PlanValidator.validatePlan(cachedPlan);
    if (validatedCache.isValid) {
      cacheHit = true;
      plan = cachedPlan;
    }
  }

  if (!cacheHit) {
    if (shouldSkipRewrite || intentCategory === "GREETING_CONVERSATIONAL") {
      const isConversational = intentCategory === "GREETING_CONVERSATIONAL";

      let subTasks: SubTask[] = [];
      let agents: string[] = [];
      let tools: string[] = [];

      if (isConversational) {
        subTasks = [];
        agents = [];
        tools = [];
      } else if (intentCategory === "MULTI_STEP_COGNITIVE_GOAL") {
        subTasks = [
          {
            id: "task-1",
            type: "DATABASE_QUERY",
            query: rawQuery,
            status: "pending",
            dependsOn: [],
          },
          {
            id: "task-2",
            type: "KNOWLEDGE_LOOKUP",
            query: rawQuery,
            status: "pending",
            dependsOn: [],
          },
        ];
        agents = ["DatabaseAgent", "KnowledgeAgent"];
        tools = ["university_database_query", "knowledge_retrieval"];
      } else {
        subTasks = [
          {
            id: "task-1",
            type:
              intentCategory === "STRUCTURED_DATA_QUERY"
                ? "DATABASE_QUERY"
                : intentCategory === "WORKFLOW_ACTION_TRIGGER"
                ? "WORKFLOW_EXECUTION"
                : intentCategory === "DOCUMENT_DELIVERY"
                ? "DOCUMENT_DELIVERY"
                : "KNOWLEDGE_LOOKUP",
            query: rawQuery,
            status: "pending",
            dependsOn: [],
          },
        ];
        agents =
          intentCategory === "STRUCTURED_DATA_QUERY"
            ? ["DatabaseAgent"]
            : intentCategory === "WORKFLOW_ACTION_TRIGGER"
            ? ["WorkflowAgent"]
            : intentCategory === "DOCUMENT_DELIVERY"
            ? ["DocumentDeliveryAgent"]
            : ["KnowledgeAgent"];
        tools =
          intentCategory === "STRUCTURED_DATA_QUERY"
            ? ["university_database_query"]
            : intentCategory === "WORKFLOW_ACTION_TRIGGER"
            ? ["workflow_action_execution"]
            : intentCategory === "DOCUMENT_DELIVERY"
            ? ["document_delivery"]
            : ["knowledge_retrieval"];
      }

      const richCost: RichCostEstimate = {
        llmCalls: isConversational ? 0 : 1,
        dbQueries: intentCategory === "STRUCTURED_DATA_QUERY" ? 1 : 0,
        vectorSearches: intentCategory === "INFORMATION_RETRIEVAL" ? 1 : 0,
        workflowCalls: intentCategory === "WORKFLOW_ACTION_TRIGGER" ? 1 : 0,
        graphTraversals: 0,
        estimatedLatencyMs: isConversational ? 20 : 150,
        estimatedTokens: isConversational ? 50 : 200,
        estimatedCostUSD: 0,
        cacheHitProbability: 0.9,
      };

      const confidenceBreakdown: ConfidenceBreakdown = {
        overall: intentResult.confidence,
        intent: intentResult.confidence,
        entity: 0.95,
        toolSelection: 0.90,
        dependency: 1.0,
      };

      const rawPlan: CognitivePlan = {
        goal: rawQuery,
        goalStatement: recognizedGoal.objective,
        normalizedGoal,
        priority: recognizedGoal.priority,
        reasoning: "Rule-based fast-path planner dispatch",
        complexity: isConversational ? "low" : "medium",
        agents,
        tools,
        subTasks,
        currentStepIndex: 0,
        isComplete: false,
        costEstimate: richCost,
        confidence: intentResult.confidence,
        confidenceBreakdown,
        executionStrategy: buildExecutionStrategy(subTasks),
      };

      const { optimizedPlan } = PlanOptimizer.optimizePlan(rawPlan);
      plan = optimizedPlan;
      PlanValidator.validatePlan(plan);
      CacheLayer.set(cacheKey, plan, CACHE_TTL.PLAN);
    } else {
      const prompt = `You are an Enterprise Cognitive Planning Agent for a university platform.
Analyze the query and produce a structured cognitive plan in JSON format.

Query: "${rawQuery}"
Intent: ${intentCategory}

Return ONLY valid JSON matching this schema:
{
  "isConversational": boolean,
  "goalStatement": "concise goal summary (max 200 chars)",
  "rewrittenQuery": "string",
  "variants": ["string"],
  "entities": ["string"],
  "costEstimate": {
    "llmCalls": number,
    "dbQueries": number,
    "vectorSearches": number,
    "workflowCalls": number,
    "graphTraversals": number
  },
  "confidenceBreakdown": {
    "overall": number (0.0 to 1.0),
    "intent": number,
    "entity": number,
    "toolSelection": number,
    "dependency": number
  },
  "subTasks": [
    {
      "id": "task-1",
      "type": "KNOWLEDGE_LOOKUP" | "DATABASE_QUERY" | "WORKFLOW_EXECUTION",
      "query": "string",
      "dependsOn": ["task-id"]
    }
  ]
}
Return ONLY JSON, no markdown fences.`;

      try {
        const response = await lightweightLlm.invoke(prompt);
        const content = response.content.toString().trim();
        const cleaned = content.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

        const parsed = JSON.parse(cleaned) as UnifiedPlannerLLMResponse;

        const subTasksInput = (parsed.subTasks || []).map((st, i) => ({
          id: st.id || `task-${i + 1}`,
          type: st.type,
          query: st.query,
          dependsOn: st.dependsOn || [],
        }));

        const decomposedSubTasks = TaskDecomposer.decomposeGoal(
          parsed.rewrittenQuery || rawQuery,
          subTasksInput
        );

        const selectedAgents = new Set<string>();
        const selectedTools = new Set<string>();

        decomposedSubTasks.forEach((st) => {
          if (st.type === "KNOWLEDGE_LOOKUP") {
            selectedAgents.add("KnowledgeAgent");
            selectedTools.add("knowledge_retrieval");
          } else if (st.type === "DATABASE_QUERY") {
            selectedAgents.add("DatabaseAgent");
            selectedTools.add("university_database_query");
          } else if (st.type === "WORKFLOW_EXECUTION") {
            selectedAgents.add("WorkflowAgent");
            selectedTools.add("workflow_action_execution");
          } else if (st.type === "DOCUMENT_DELIVERY") {
            selectedAgents.add("DocumentDeliveryAgent");
            selectedTools.add("document_delivery");
          }
        });

        const richCost: RichCostEstimate = {
          llmCalls: parsed.costEstimate?.llmCalls ?? 1,
          dbQueries: parsed.costEstimate?.dbQueries ?? 0,
          vectorSearches: parsed.costEstimate?.vectorSearches ?? 0,
          workflowCalls: parsed.costEstimate?.workflowCalls ?? 0,
          graphTraversals: parsed.costEstimate?.graphTraversals ?? 0,
          estimatedLatencyMs: 350,
          estimatedTokens: 450,
          estimatedCostUSD: 0.0002,
          cacheHitProbability: 0.5,
        };

        const agentsList = Array.from(selectedAgents);
        const complexity = ComplexityCalculator.calculateComplexity(
          agentsList,
          decomposedSubTasks,
          richCost,
          parsed.isConversational
        );

        const rawPlan: CognitivePlan = {
          goal: parsed.rewrittenQuery || rawQuery,
          goalStatement: (parsed.goalStatement || recognizedGoal.objective).substring(0, 200),
          normalizedGoal,
          priority: recognizedGoal.priority,
          reasoning: "LLM-generated cognitive plan",
          complexity,
          agents: agentsList,
          tools: Array.from(selectedTools),
          subTasks: decomposedSubTasks,
          currentStepIndex: 0,
          isComplete: false,
          costEstimate: richCost,
          confidence: parsed.confidenceBreakdown?.overall ?? 0.85,
          confidenceBreakdown: parsed.confidenceBreakdown || {
            overall: 0.85,
            intent: 0.85,
            entity: 0.85,
            toolSelection: 0.85,
            dependency: 0.85,
          },
          executionStrategy: buildExecutionStrategy(decomposedSubTasks),
        };

        const { optimizedPlan } = PlanOptimizer.optimizePlan(rawPlan);
        plan = optimizedPlan;
        const validation = PlanValidator.validatePlan(plan);

        if (!validation.isValid) {
          plannerFailed = true;
          errorOccurred = true;
        } else {
          CacheLayer.set(cacheKey, plan, CACHE_TTL.PLAN);
        }
      } catch (err) {
        plannerFailed = true;
        errorOccurred = true;

        const fallbackSubTask: SubTask = {
          id: "task-1",
          type: "KNOWLEDGE_LOOKUP",
          query: rawQuery,
          status: "pending",
          dependsOn: [],
        };

        const fallbackCost: RichCostEstimate = {
          llmCalls: 1,
          dbQueries: 0,
          vectorSearches: 1,
          workflowCalls: 0,
          graphTraversals: 0,
          estimatedLatencyMs: 150,
          estimatedTokens: 200,
          estimatedCostUSD: 0,
          cacheHitProbability: 0,
        };

        plan = {
          goal: rawQuery,
          goalStatement: recognizedGoal.objective,
          normalizedGoal,
          priority: recognizedGoal.priority,
          complexity: "low",
          agents: ["KnowledgeAgent"],
          tools: ["knowledge_retrieval"],
          subTasks: [fallbackSubTask],
          currentStepIndex: 0,
          isComplete: false,
          costEstimate: fallbackCost,
          confidence: 0.60,
          confidenceBreakdown: {
            overall: 0.60,
            intent: 0.60,
            entity: 0.60,
            toolSelection: 0.60,
            dependency: 0.60,
          },
          executionStrategy: buildExecutionStrategy([fallbackSubTask]),
        };

        PlanValidator.validatePlan(plan);
      }
    }
  }

  // 3. Execution Simulation & Meta Reasoning
  const simulationReport = ExecutionSimulator.simulate(plan);
  const metaReasoning = MetaReasoner.optimizePlanMeta(plan, simulationReport);
  plan.simulationReport = simulationReport;
  plan.metaReasoning = metaReasoning;

  const routedPath = routeFromSubTasks(plan.subTasks);

  const { durationMs } = StageTimer.end(
    "plannerNode",
    stageStart,
    { organizationId, userId, cacheHit },
    errorOccurred
  );

  const timings: Record<string, number> = {
    plannerNode: durationMs,
    analysisNode: durationMs,
  };

  console.log(
    JSON.stringify({
      event: "PLAN_GENERATED",
      goalStatement: plan.goalStatement,
      normalizedGoal: plan.normalizedGoal,
      complexity: plan.complexity,
      subTaskCount: plan.subTasks.length,
      agentTypes: plan.agents,
      confidence: plan.confidence,
      simulationReport: plan.simulationReport,
      metaReasoning: plan.metaReasoning,
      cacheHit,
      organizationId,
      userId,
      durationMs,
      timestamp: new Date().toISOString(),
    })
  );

  const queryAnalysis = {
    isConversational: (plan.agents || []).length === 0,
    intentCategory,
    rewrittenQuery: plan.goal,
    variants: [],
    entities: recognizedGoal.entities,
  };

  return {
    queryAnalysis,
    plan,
    routedPath,
    plannerFailed,
    timings,
  };
}
