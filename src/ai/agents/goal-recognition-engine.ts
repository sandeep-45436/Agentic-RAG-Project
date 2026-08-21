import { v4 as uuidv4 } from "uuid";
import { IntentAnalysisResult } from "./intent-classifier";

export interface RecognizedGoal {
  goalId: string;
  intent: "KNOWLEDGE" | "DATABASE" | "WORKFLOW" | "HYBRID" | "CONVERSATIONAL" | "DOCUMENT_DELIVERY";
  objective: string;
  entities: string[];
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
}

export class GoalRecognitionEngine {
  public static recognizeGoal(
    rawQuery: string,
    intentResult?: IntentAnalysisResult
  ): RecognizedGoal {
    const trimmed = rawQuery.trim();
    const goalId = `goal_${uuidv4().substring(0, 8)}`;
    const entities = intentResult ? Object.values(intentResult.entities).filter((v): v is string => typeof v === "string") : [];
    const category = intentResult?.category ?? "INFORMATION_RETRIEVAL";
    const confidence = intentResult?.confidence ?? 0.85;

    let intent: RecognizedGoal["intent"] = "KNOWLEDGE";
    let priority: RecognizedGoal["priority"] = "MEDIUM";
    let objective = trimmed;

    switch (category) {
      case "GREETING_CONVERSATIONAL":
        intent = "CONVERSATIONAL";
        priority = "LOW";
        objective = "Respond to a conversational greeting";
        break;
      case "STRUCTURED_DATA_QUERY":
        intent = "DATABASE";
        priority = "MEDIUM";
        objective = `Execute structured data lookup for query: ${trimmed}`.substring(0, 200);
        break;
      case "WORKFLOW_ACTION_TRIGGER":
        intent = "WORKFLOW";
        priority = "HIGH";
        objective = `Trigger workflow execution for action: ${trimmed}`.substring(0, 200);
        break;
      case "MULTI_STEP_COGNITIVE_GOAL":
        intent = "HYBRID";
        priority = "HIGH";
        objective = `Decompose and analyze complex cognitive goal: ${trimmed}`.substring(0, 200);
        break;
      case "DOCUMENT_DELIVERY":
        intent = "DOCUMENT_DELIVERY";
        priority = "MEDIUM";
        objective = `Retrieve and deliver document for: ${trimmed}`.substring(0, 200);
        break;
      case "INFORMATION_RETRIEVAL":
      default:
        intent = "KNOWLEDGE";
        priority = "MEDIUM";
        objective = `Retrieve academic/university policy context for: ${trimmed}`.substring(0, 200);
        break;
    }

    // High priority detection based on key urgency signals
    if (/\b(urgent|probation|expulsion|emergency|suspended|fail|risk)\b/i.test(trimmed)) {
      priority = "CRITICAL";
    }

    return {
      goalId,
      intent,
      objective,
      entities,
      priority,
      confidence,
    };
  }
}
