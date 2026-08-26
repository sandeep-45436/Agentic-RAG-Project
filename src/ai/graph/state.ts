import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { VectorPayload } from "@/server/services/vector.service";
import { RetrievalDebugInfo } from "@/server/services/retrieval.service";
import { Role } from "@/ai/tools/tool-registry";
import { DocumentDeliveryResult } from "@/ai/documents/document-delivery.types";

export interface SubTask {
  id: string;
  type: "KNOWLEDGE_LOOKUP" | "DATABASE_QUERY" | "WORKFLOW_EXECUTION" | "DOCUMENT_DELIVERY";
  query: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  graphTraversal?: boolean;  // triggers Neo4j fan-out in knowledgeNode
  outputKey?: string;        // key whose value downstream tasks may reference
  dependsOn?: string[];      // subtask ID dependencies
  timeoutMs?: number;        // per-task execution budget
  retryPolicy?: { maxRetries: number; backoffMs: number };
}

export interface RichCostEstimate {
  llmCalls: number;
  dbQueries: number;
  vectorSearches: number;
  workflowCalls: number;
  graphTraversals: number;
  estimatedLatencyMs: number;
  estimatedTokens: number;
  estimatedCostUSD: number;
  cacheHitProbability: number;
}

export interface ConfidenceBreakdown {
  overall: number;          // [0.0, 1.0]
  intent: number;           // [0.0, 1.0]
  entity: number;           // [0.0, 1.0]
  toolSelection: number;    // [0.0, 1.0]
  dependency: number;       // [0.0, 1.0]
}

export interface ExecutionStrategy {
  parallelGroups: string[][];
  sequentialGroups: string[][];
  requiresVerification: boolean;
  requiresApproval: boolean;
  timeoutBudgetMs: number;
  retryPolicy: { maxRetries: number };
}

export interface FailureContext {
  failedTaskId: string;
  failedTaskType: string;
  errorMessage: string;
  attemptedQuery: string;
}

export interface CognitivePlan {
  goal: string;
  goalStatement?: string;
  normalizedGoal?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reasoning?: string;
  complexity?: "low" | "medium" | "high";
  agents?: string[];
  tools?: string[];
  subTasks: SubTask[];
  currentStepIndex: number;
  isComplete: boolean;
  costEstimate?: RichCostEstimate;
  confidence?: number;
  confidenceBreakdown?: ConfidenceBreakdown;
  executionStrategy?: ExecutionStrategy;
  validationReport?: { isValid: boolean; checksRan: string[]; errorReason?: string };
  optimizationSummary?: { subtasksRemoved: number; agentsPruned: number; passesExecuted: string[] };
  orchestrationReady?: boolean;
  failureContext?: FailureContext;
  kernelContext?: any;
  predictionResult?: any;
  simulationReport?: any;
  metaReasoning?: any;
}

/**
 * Defines the strict state object flowing through our multi-agent cognitive architecture.
 */
export const GraphState = Annotation.Root({
  // Conversation History & Messages
  messages: Annotation<BaseMessage[]>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),

  // Multi-Tenant & RBAC Context
  organizationId: Annotation<string>(),
  userId: Annotation<string>(),
  userRole: Annotation<Role>({
    reducer: (curr, update) => update || curr,
    default: () => "ADMIN",
  }),
  departmentId: Annotation<string | null>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => null,
  }),
  collegeId: Annotation<string | null>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => null,
  }),

  // Cognitive Plan & Planning State
  plan: Annotation<CognitivePlan | null>({
    reducer: (curr, update) => update,
    default: () => null,
  }),

  // Pre-analyzed Query Info
  queryAnalysis: Annotation<any>({
    reducer: (curr, update) => update,
    default: () => null,
  }),

  // Target Routing Path
  routedPath: Annotation<"PLANNER" | "KNOWLEDGE" | "DATABASE" | "WORKFLOW" | "MEMORY" | "COMBINED" | "DOCUMENT_DELIVERY">({
    reducer: (curr, update) => update,
    default: () => "PLANNER",
  }),

  // Knowledge Subsystem Context (Hybrid RAG Engine output)
  knowledgeContext: Annotation<{
    chunks: VectorPayload[];
    debugInfo: RetrievalDebugInfo | null;
  }>({
    reducer: (curr, update) => ({
      chunks: [...(curr?.chunks || []), ...(update?.chunks || [])],
      debugInfo: update?.debugInfo || curr?.debugInfo || null,
    }),
    default: () => ({ chunks: [], debugInfo: null }),
  }),

  // Backward Compatibility Fields for Legacy Routers & Components
  retrievedChunks: Annotation<VectorPayload[]>({
    reducer: (curr, update) => update,
    default: () => [],
  }),

  retrievalDebugInfo: Annotation<any>({
    reducer: (curr, update) => update,
    default: () => null,
  }),

  // Database Subsystem Context
  databaseContext: Annotation<Array<{ toolName: string; records: any }>>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),

  // Workflow / External Tool Outputs
  toolOutputs: Annotation<Array<{ toolName: string; result: any }>>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),

  // Verification & Safety Audit
  verification: Annotation<{
    isGrounded: boolean;
    confidenceScore: number;
    hallucinationFlag: boolean;
    recommendedAction?: "PASS" | "REGENERATE" | "PARTIAL_RESPONSE" | "REJECT";
    unsupportedClaims?: string[];
    misattributedCitations?: string[];
  } | null>({
    reducer: (curr, update) => update,
    default: () => null,
  }),

  // Memory State
  memory: Annotation<{
    citedDocumentIds: string[];
    userPreferences: Record<string, any>;
  }>({
    reducer: (curr, update) => update,
    default: () => ({ citedDocumentIds: [], userPreferences: {} }),
  }),

  // Formatted Citations String
  formattedCitations: Annotation<string>({
    reducer: (curr, update) => update,
    default: () => "",
  }),

  // Final System Prompt for Stream Output
  finalPrompt: Annotation<string>({
    reducer: (curr, update) => update,
    default: () => "",
  }),

  // Routing decision set by queryComplexityRouter before plannerNode executes
  routingDecision: Annotation<"SIMPLE" | "COMPLEX" | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Per-stage timing map: { stageName: durationMs }
  timings: Annotation<Record<string, number>>({
    reducer: (curr, update) => ({ ...curr, ...update }),
    default: () => ({}),
  }),

  // Document Delivery context (PDF extraction results)
  documentDelivery: Annotation<DocumentDeliveryResult | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Flag set true when unifiedPlannerNode LLM call fails
  plannerFailed: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),

  // Generated Final Response Draft for grounding validation
  finalResponse: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "",
  }),
});
