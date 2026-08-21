import { GoalRecognitionEngine, RecognizedGoal } from "../agents/goal-recognition-engine";
import { GoalNormalizer } from "../agents/goal-normalizer";
import { WorldStateManager, WorldStateSnapshot } from "./world-state-manager";
import { PolicyEngine, PolicyEvaluation } from "./policy-engine";
import { DecisionMemory, DecisionMemoryEntry } from "./decision-memory";
import { IntentClassifier, IntentAnalysisResult } from "../agents/intent-classifier";

export interface KernelAnalysisContext {
  recognizedGoal: RecognizedGoal;
  normalizedGoal: string;
  intentResult: IntentAnalysisResult;
  worldState: WorldStateSnapshot;
  policyEvaluation: PolicyEvaluation;
  relevantDecisions: DecisionMemoryEntry[];
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

    return {
      recognizedGoal,
      normalizedGoal,
      intentResult,
      worldState,
      policyEvaluation,
      relevantDecisions,
    };
  }
}
