import { GraphState } from "../graph/state";
import { RetrievalService } from "@/server/services/retrieval.service";
import { StageTimer } from "@/ai/instrumentation/stage-timer";
import { getMessageText } from "@/lib/utils";
import { RetrievalStrategySelector } from "@/ai/knowledge/retrieval-strategy-selector";
import { EvidenceGraphBuilder } from "@/ai/knowledge/evidence-graph-builder";
import { EvidenceVerifier } from "@/ai/knowledge/evidence-verifier";
import { ContextOptimizer } from "@/ai/knowledge/context-optimizer";
import { KnowledgeConfidenceEngine } from "@/ai/knowledge/knowledge-confidence-engine";

/**
 * Knowledge Agent Node: Intelligent Knowledge Subsystem Node
 * Integrates Strategy Selection -> Hybrid Retrieval -> Evidence Graph Building
 * -> Verification -> Context Optimization -> Confidence Computation.
 */
export async function knowledgeAgent(state: typeof GraphState.State) {
  const stageStart = StageTimer.start("knowledgeNode");
  let cacheHit = false;
  let errorOccurred = false;

  try {
    const { messages, organizationId, queryAnalysis, plan, userId, userRole, departmentId, collegeId } = state;
    const latestMessage = messages[messages.length - 1];

    if (!latestMessage || !organizationId) {
      const { durationMs } = StageTimer.end("knowledgeNode", stageStart, {
        organizationId: state.organizationId,
        userId: state.userId,
        cacheHit,
      });
      return {
        knowledgeContext: { chunks: [], debugInfo: null },
        retrievedChunks: [],
        retrievalDebugInfo: null,
        timings: { knowledgeNode: durationMs },
      };
    }

    // Determine query text
    let targetQuery = getMessageText(latestMessage);
    if (plan && plan.subTasks && plan.subTasks[plan.currentStepIndex]) {
      targetQuery = plan.subTasks[plan.currentStepIndex].query || targetQuery;
    }

    // 1. Retrieval Strategy Selection
    const strategy = RetrievalStrategySelector.selectStrategy(targetQuery, queryAnalysis?.intentCategory);
    console.log(`[KnowledgeAgent] Strategy selected: ${strategy.mode} (${strategy.reason}), Dept: ${departmentId || 'GLOBAL'}`);

    const chatHistory = messages
      .slice(0, -1)
      .map((msg) => ({
        role: (msg as any).role === "user" ? ("user" as const) : ("assistant" as const),
        content: getMessageText(msg),
        citations: (msg as any).citations ?? null,
      }));

    // Build pre-retrieval access context
    const accessContext: import("@/server/services/document-access-policy").DocumentAccessContext = {
      organizationId,
      userId,
      userRole: (userRole as any) || "STUDENT",
      departmentId,
      collegeId,
    };

    // 2. Hybrid Retrieval Execution with strict pre-retrieval authorization
    const result = await RetrievalService.buildContextualPrompt(
      targetQuery,
      organizationId,
      chatHistory,
      queryAnalysis || undefined,
      accessContext
    );

    const rawChunks = result.chunks || [];
    const debugInfo = result.debugInfo || null;

    if (debugInfo?.cacheHit === true) {
      cacheHit = true;
    }

    // 3. Evidence Graph Construction
    const evidenceGraph = EvidenceGraphBuilder.buildGraph(rawChunks);

    // 4. Evidence Verification & Filtering
    const verificationReport = EvidenceVerifier.verifyEvidence(rawChunks);
    const verifiedChunks = verificationReport.verifiedChunks;

    // 5. Context Optimization & Reranking
    const optimizationReport = ContextOptimizer.optimizeContext(verifiedChunks);

    // 6. Knowledge Confidence Scoring
    const confidenceReport = KnowledgeConfidenceEngine.computeConfidence(
      verifiedChunks,
      verificationReport,
      evidenceGraph
    );

    const { durationMs } = StageTimer.end("knowledgeNode", stageStart, {
      organizationId: state.organizationId,
      userId: state.userId,
      cacheHit,
    });

    // Structured Telemetry Event
    const telemetryEvent = {
      event: "KNOWLEDGE_INTELLIGENCE_EXECUTED",
      strategyMode: strategy.mode,
      rawChunkCount: rawChunks.length,
      verifiedChunkCount: verifiedChunks.length,
      graphNodes: evidenceGraph.nodeCount,
      groundednessScore: confidenceReport.groundednessScore,
      confidenceLevel: confidenceReport.confidenceLevel,
      organizationId: state.organizationId,
      userId: state.userId,
      durationMs,
      timestamp: new Date().toISOString(),
    };
    console.log(JSON.stringify(telemetryEvent));

    return {
      knowledgeContext: {
        chunks: verifiedChunks,
        debugInfo,
        evidenceGraph,
        verificationReport,
        optimizationReport,
        confidenceReport,
      },
      retrievedChunks: verifiedChunks,
      retrievalDebugInfo: debugInfo,
      timings: { knowledgeNode: durationMs },
    };
  } catch (error) {
    errorOccurred = true;
    console.error("[KnowledgeAgent] Hybrid retrieval failed:", error);
    const { durationMs } = StageTimer.end("knowledgeNode", stageStart, {
      organizationId: state.organizationId,
      userId: state.userId,
      cacheHit,
    }, true);
    return {
      knowledgeContext: { chunks: [], debugInfo: null },
      retrievedChunks: [],
      retrievalDebugInfo: null,
      timings: { knowledgeNode: durationMs },
    };
  }
}
