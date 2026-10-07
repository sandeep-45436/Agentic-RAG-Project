import { GoalRecognitionEngine, RecognizedGoal } from "../agents/goal-recognition-engine";
import { GoalNormalizer } from "../agents/goal-normalizer";
import { WorldStateManager, WorldStateSnapshot } from "./world-state-manager";
import { PolicyEngine, PolicyEvaluation } from "./policy-engine";
import { DecisionMemory, DecisionMemoryEntry } from "./decision-memory";
import { IntentClassifier, IntentAnalysisResult } from "../agents/intent-classifier";
import { AcademicPolicyCache } from "../cag/academic-policy-cache";

export type KnowledgeRouteType =
  | "CAG_STATIC_POLICY"           // Instant policy definitions, credit limits, grading scales
  | "DETERMINISTIC_ACADEMIC_AUDIT" // Degree credits check, prerequisite validation, CGPA calculations
  | "HYBRID_RAG"                   // Dynamic circulars, syllabus specs, PDF handbooks (Qdrant + BM25 + Neo4j)
  | "STRUCTURED_DB"               // Live student transcripts, enrolled sections, faculty directories
  | "CONVERSATIONAL";

export interface CagResolution {
  isResolved: boolean;
  cachedResponse?: string;
}

export interface KernelAnalysisContext {
  recognizedGoal: RecognizedGoal;
  normalizedGoal: string;
  intentResult: IntentAnalysisResult;
  worldState: WorldStateSnapshot;
  policyEvaluation: PolicyEvaluation;
  relevantDecisions: DecisionMemoryEntry[];
  knowledgeRoute: KnowledgeRouteType;
  cagResolution: CagResolution;
  cagPromptBlock: string;
}

export class CognitiveKernel {
  public static analyzeQuery(
    rawQuery: string,
    userId: string = "default-user",
    userRole: string = "ADMIN"
  ): KernelAnalysisContext {
    const intentResult = IntentClassifier.classify(rawQuery);
    const recognizedGoal = GoalRecognitionEngine.recognizeGoal(rawQuery, intentResult);
    const normalizedGoal = GoalNormalizer.normalizeGoal(rawQuery, intentResult.category);
    const worldState = WorldStateManager.getSnapshot(userId, userRole);
    const policyEvaluation = PolicyEngine.evaluatePolicy(rawQuery, normalizedGoal, worldState);
    const relevantDecisions = DecisionMemory.queryMemory(normalizedGoal);

    // 1. Evaluate CAG layer for instant resolution
    const cagMatch = AcademicPolicyCache.resolveStaticQuery(rawQuery);
    const cagResolution: CagResolution = {
      isResolved: cagMatch.matched,
      cachedResponse: cagMatch.response,
    };

    // 2. Determine optimal knowledge route
    let knowledgeRoute: KnowledgeRouteType = "HYBRID_RAG";

    if (intentResult.category === "GREETING_CONVERSATIONAL") {
      knowledgeRoute = "CONVERSATIONAL";
    } else if (cagMatch.matched) {
      knowledgeRoute = "CAG_STATIC_POLICY";
    } else if (
      normalizedGoal === "VALIDATE_COURSE_PREREQUISITES" ||
      normalizedGoal === "AUDIT_DEGREE_CREDITS" ||
      /\b(degree audit|prerequisite check|credits left|cgpa calculation)\b/i.test(rawQuery)
    ) {
      knowledgeRoute = "DETERMINISTIC_ACADEMIC_AUDIT";
    } else if (intentResult.category === "STRUCTURED_DATA_QUERY") {
      knowledgeRoute = "STRUCTURED_DB";
    } else {
      knowledgeRoute = "HYBRID_RAG";
    }

    return {
      recognizedGoal,
      normalizedGoal,
      intentResult,
      worldState,
      policyEvaluation,
      relevantDecisions,
      knowledgeRoute,
      cagResolution,
      cagPromptBlock: AcademicPolicyCache.getStaticPolicyPromptBlock(),
    };
  }
}
