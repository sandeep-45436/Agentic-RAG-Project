/**
 * queryComplexityRouter — pipeline node that classifies queries as SIMPLE or COMPLEX.
 *
 * Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 1.4
 *
 * Routing rules (evaluated in order):
 *  1. GREETING_CONVERSATIONAL intent → SIMPLE (zero lightweightLlm calls)
 *  2. messages.length ≤ 2, no unresolved pronoun, and isFastPath === true → SIMPLE (zero lightweightLlm calls)
 *  3. Default → COMPLEX
 *
 * On IntentClassifier error: default to COMPLEX, flag errorOccurred for StageTimer.
 */

import { GraphState } from "@/ai/graph/state";
import { IntentClassifier } from "@/ai/agents/intent-classifier";
import { StageTimer } from "@/ai/instrumentation/stage-timer";
import { getMessageText } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type RoutingDecision = "SIMPLE" | "COMPLEX";

// Regex for unresolved pronoun tokens (whole-word, case-insensitive)
const UNRESOLVED_PRONOUN_RE = /\b(he|she|it|they|this|that|these|those)\b/i;

// ---------------------------------------------------------------------------
// Node implementation
// ---------------------------------------------------------------------------

/**
 * Classifies incoming query complexity and sets `routingDecision` in GraphState.
 *
 * @param state - Current LangGraph state slice
 * @returns Partial state patch containing `routingDecision` and `timings`
 */
export async function queryComplexityRouter(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  // Req 7.1: stageStart MUST be the very first operation inside the node
  const stageStart = StageTimer.start("queryComplexityRouter");

  let routingDecision: RoutingDecision = "COMPLEX";
  let errorOccurred = false;

  try {
    // Retrieve the latest message text
    const latestMessage = state.messages[state.messages.length - 1];
    const query = getMessageText(latestMessage).trim();

    // Classify intent (rule-based, synchronous — zero LLM calls)
    const intentResult = IntentClassifier.classify(query);

    // Rule 1: Greeting / conversational shortcut → SIMPLE (Req 2.4)
    if (intentResult.category === "GREETING_CONVERSATIONAL") {
      routingDecision = "SIMPLE";
    }
    // Rule 2: Short conversational queries (excluding information retrieval and data queries) → SIMPLE (Req 2.5)
    else if (
      state.messages.length <= 2 &&
      !UNRESOLVED_PRONOUN_RE.test(query) &&
      intentResult.isFastPath === true &&
      intentResult.category !== "INFORMATION_RETRIEVAL" &&
      intentResult.category !== "STRUCTURED_DATA_QUERY"
    ) {
      routingDecision = "SIMPLE";
    }
    // Rule 3: Default → COMPLEX (Information Retrieval, Structured Data, Goals)
    else {
      routingDecision = "COMPLEX";
    }
  } catch (err) {
    // Req 2.6 / 1.4: on classify error, default to COMPLEX and flag timing
    errorOccurred = true;
    routingDecision = "COMPLEX";
    console.error(
      JSON.stringify({
        event: "QUERY_COMPLEXITY_ROUTER_ERROR",
        message: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      })
    );
  }

  // Req 7.2 / 7.3: record end-of-stage timing
  const { durationMs } = StageTimer.end(
    "queryComplexityRouter",
    stageStart,
    {
      organizationId: state.organizationId,
      userId: state.userId,
      cacheHit: false,
    },
    errorOccurred
  );

  return {
    routingDecision,
    // Store __pipelineEntry so verificationBudgetRouter can compute cumulative elapsed (Task 10.5)
    timings: { queryComplexityRouter: durationMs, __pipelineEntry: stageStart },
  };
}
