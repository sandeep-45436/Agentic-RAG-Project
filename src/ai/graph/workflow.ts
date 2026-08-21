import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state";
import { queryComplexityRouter } from "@/ai/graph/query-complexity-router";
import { unifiedPlannerNode } from "@/ai/graph/unified-planner-node";
import { knowledgeAgent } from "../agents/knowledge.agent";
import { databaseAgent } from "../agents/database.agent";
import { workflowAgent } from "../agents/workflow.agent";
import { verificationAgent } from "../agents/verification.agent";
import { citationAgent } from "../agents/citation-agent";
import { memoryAgent } from "../agents/memory-agent";
import { responseAgent } from "../agents/response-agent";
import { combinedMergeAgent } from "../agents/combined-merge.agent";
import { documentDeliveryAgent } from "../agents/document-delivery.agent";
import { withTimeout } from "@/ai/utils/with-timeout";
import { latencyBudgets } from "@/ai/config/latency-budgets";

// ---------------------------------------------------------------------------
// Task 10.1 — SIMPLE / COMPLEX router from queryComplexityRouterNode
// ---------------------------------------------------------------------------

/**
 * Routes from queryComplexityRouterNode based on the routingDecision field.
 * SIMPLE → memoryNode (fast path, skips all RAG / planning nodes)
 * COMPLEX → unifiedPlannerNode (full pipeline)
 */
const complexityEdgeRouter = (state: typeof GraphState.State): string => {
  return state.routingDecision === "SIMPLE" ? "memoryNode" : "unifiedPlannerNode";
};

// ---------------------------------------------------------------------------
// Task 10.2 — cognitive route decision from unifiedPlannerNode
// Preserves existing cognitiveRouteDecision logic, now wired from unifiedPlannerNode.
// ---------------------------------------------------------------------------

/**
 * After unifiedPlannerNode determines the routedPath, dispatch to the
 * appropriate subsystem agent node.
 *
 * DATABASE  → databaseNode
 * WORKFLOW  → workflowNode
 * MEMORY    → memoryNode  (COMPLEX query resolved entirely from memory)
 * default   → knowledgeNode
 */
const cognitiveRouteDecision = (state: typeof GraphState.State): string => {
  const path = state.routedPath;
  if (path === "DATABASE") return "databaseNode";
  if (path === "WORKFLOW") return "workflowNode";
  if (path === "MEMORY") return "memoryNode";
  if (path === "COMBINED") return "knowledgeNode"; // Start with knowledge, then fan-out to DB
  if (path === "DOCUMENT_DELIVERY") return "documentDeliveryNode";
  return "knowledgeNode";
};

// ---------------------------------------------------------------------------
// Task 10.5 — conditional verificationNode skip at 1800ms cumulative elapsed
// ---------------------------------------------------------------------------

const VERIFICATION_SKIP_THRESHOLD_MS = 1800;

/**
 * After citationNode, check whether enough budget remains to run verificationNode.
 * Uses timings.__pipelineEntry written by queryComplexityRouter as the wall-clock
 * reference for pipeline start.
 *
 * Requirements: 8.4
 */
const verificationBudgetRouter = (state: typeof GraphState.State): string => {
  const pipelineEntry = state.timings?.__pipelineEntry ?? Date.now();
  const elapsed = Date.now() - pipelineEntry;

  if (elapsed > VERIFICATION_SKIP_THRESHOLD_MS) {
    console.log(
      JSON.stringify({
        event: "VERIFICATION_SKIPPED_BUDGET",
        cumulativeElapsedMs: elapsed,
        thresholdMs: VERIFICATION_SKIP_THRESHOLD_MS,
        timestamp: new Date().toISOString(),
      })
    );
    return "responseNode";
  }

  return "verificationNode";
};

// ---------------------------------------------------------------------------
// Task 10.4 — SIMPLE-path fallback re-entry after memoryNode
// ---------------------------------------------------------------------------

/**
 * After memoryNode completes, check whether it produced usable output.
 *
 * If finalPrompt is empty/null → the memory agent returned no content;
 * emit SIMPLE_PATH_FALLBACK and re-enter the COMPLEX path at unifiedPlannerNode.
 * Otherwise go directly to responseNode.
 *
 * Requirements: 2.7
 */
const memoryFallbackRouter = (state: typeof GraphState.State): string => {
  const hasContent =
    typeof state.finalPrompt === "string" && state.finalPrompt.trim().length > 0;

  if (!hasContent) {
    const latestMessage = state.messages[state.messages.length - 1];
    const originalQuery =
      latestMessage && "content" in latestMessage
        ? String((latestMessage as any).content)
        : "";

    console.log(
      JSON.stringify({
        event: "SIMPLE_PATH_FALLBACK",
        originalQuery,
        memoryAgentError: "memoryNode returned empty finalPrompt",
        timestamp: new Date().toISOString(),
      })
    );

    return "unifiedPlannerNode"; // re-enter COMPLEX path
  }

  return "responseNode";
};

// ---------------------------------------------------------------------------
// Build the LangGraph workflow
// ---------------------------------------------------------------------------

const workflow = new StateGraph(GraphState)
  // ── Nodes ──────────────────────────────────────────────────────────────────
  // Task 10.1: entry node — classifies SIMPLE vs COMPLEX before any planning
  .addNode("queryComplexityRouterNode", queryComplexityRouter)
  // Task 10.2: unified planner replaces the old analysisNode + plannerNode pair
  .addNode("unifiedPlannerNode", unifiedPlannerNode)
  // Subsystem agent nodes (unchanged from prior architecture)
  .addNode("knowledgeNode", knowledgeAgent)
  .addNode("databaseNode", databaseAgent)
  .addNode("workflowNode", workflowAgent)
  .addNode("verificationNode", verificationAgent)
  .addNode("citationNode", citationAgent)
  .addNode("memoryNode", memoryAgent)
  .addNode("responseNode", responseAgent)
  .addNode("combinedMergeNode", combinedMergeAgent)
  .addNode("documentDeliveryNode", documentDeliveryAgent)

  // ── Edges ───────────────────────────────────────────────────────────────────

  // Task 10.1: pipeline entry
  .addEdge(START, "queryComplexityRouterNode")

  // Task 10.1: SIMPLE → memoryNode (fast path), COMPLEX → unifiedPlannerNode
  .addConditionalEdges("queryComplexityRouterNode", complexityEdgeRouter, {
    memoryNode: "memoryNode",
    unifiedPlannerNode: "unifiedPlannerNode",
  })

  // Task 10.2: unifiedPlannerNode → conditional subsystem routing
  // Task 10.3: parallel knowledgeNode + databaseNode fan-out is handled
  //   inside AgenticOrchestrator via Promise.allSettled; workflow routes
  //   to the first node determined by cognitiveRouteDecision.
  .addConditionalEdges("unifiedPlannerNode", cognitiveRouteDecision, {
    knowledgeNode: "knowledgeNode",
    databaseNode: "databaseNode",
    workflowNode: "workflowNode",
    memoryNode: "memoryNode",
    documentDeliveryNode: "documentDeliveryNode",
  })

  // Knowledge path: knowledge → citation → conditional verification skip
  .addConditionalEdges("knowledgeNode", (state: typeof GraphState.State): string => {
    if (state.routedPath === "COMBINED") return "databaseNode";
    return "citationNode";
  }, {
    databaseNode: "databaseNode",
    citationNode: "citationNode",
  })

  // Task 10.5: citation → verificationBudgetRouter (skip if > 1800ms elapsed)
  .addConditionalEdges("citationNode", verificationBudgetRouter, {
    verificationNode: "verificationNode",
    responseNode: "responseNode",
  })

  // Database / workflow paths converge at verificationNode
  .addConditionalEdges("databaseNode", (state: typeof GraphState.State): string => {
    if (state.routedPath === "COMBINED") return "combinedMergeNode";
    return "verificationNode";
  }, {
    combinedMergeNode: "combinedMergeNode",
    verificationNode: "verificationNode",
  })
  .addEdge("workflowNode", "verificationNode")
  .addEdge("combinedMergeNode", "citationNode")
  .addEdge("documentDeliveryNode", "citationNode")

  // Verification always feeds into response
  .addEdge("verificationNode", "responseNode")

  // Task 10.4: memoryNode → fallback router (SIMPLE path re-entry or response)
  .addConditionalEdges("memoryNode", memoryFallbackRouter, {
    unifiedPlannerNode: "unifiedPlannerNode",
    responseNode: "responseNode",
  })

  // Terminal edge
  .addEdge("responseNode", END);

// Compile the executable Cognitive LangGraph Workflow
export const appGraph = workflow.compile();

// ---------------------------------------------------------------------------
// Task 10.6 — 2000ms hard pipeline timeout + terminal events
// ---------------------------------------------------------------------------

/**
 * Invoke the compiled graph with a hard 2000ms timeout.
 *
 * Emits:
 *   - PIPELINE_COMPLETE  on normal completion
 *   - SLA_BREACH         if totalDurationMs > latencyBudgets.pipeline_total
 *   - PIPELINE_TIMEOUT   if the graph does not complete within 2000ms
 *
 * Requirements: 7.7, 8.6, 10.6
 */
export async function invokeWithTimeout(
  input: Parameters<typeof appGraph.invoke>[0],
  config?: Parameters<typeof appGraph.invoke>[1],
  tier: "simple" | "complex" = "complex"
): Promise<ReturnType<typeof appGraph.invoke>> {
  const pipelineStart = Date.now();
  const budget = tier === "simple"
    ? (latencyBudgets.pipeline_simple ?? 2000)
    : (latencyBudgets.pipeline_complex ?? 8000);
  // Cast to the concrete GraphState shape to access organizationId / userId.
  // appGraph.invoke accepts a union type that includes null/CommandInstance,
  // but callers of invokeWithTimeout always pass a real state object.
  const typedInput = input as typeof GraphState.State;

  try {
    const result = await withTimeout(
      appGraph.invoke(input, config),
      budget,
      "pipeline"
    );

    const totalDurationMs = Date.now() - pipelineStart;
    const timings: Record<string, number> = (result as any)?.timings ?? {};

    // Emit PIPELINE_COMPLETE
    console.log(
      JSON.stringify({
        event: "PIPELINE_COMPLETE",
        tier,
        budgetMs: budget,
        timings,
        totalDurationMs,
        organizationId: typedInput.organizationId,
        userId: typedInput.userId,
      })
    );

    // Emit SLA_BREACH if total duration exceeded the configured budget
    if (totalDurationMs > budget) {
      console.log(
        JSON.stringify({
          event: "SLA_BREACH",
          tier,
          budgetMs: budget,
          timings,
          totalDurationMs,
          organizationId: typedInput.organizationId,
          userId: typedInput.userId,
        })
      );
    }

    return result;
  } catch (err: any) {
    const totalElapsedMs = Date.now() - pipelineStart;
    const isTimeout =
      typeof err?.message === "string" && err.message.includes("timed out");

    if (isTimeout) {
      console.log(
        JSON.stringify({
          event: "PIPELINE_TIMEOUT",
          partialTimings: {},
          totalElapsedMs,
          organizationId: typedInput.organizationId,
          userId: typedInput.userId,
        })
      );
    }

    throw err;
  }
}
