import { GraphState } from "../graph/state";
import { StageTimer } from "@/ai/instrumentation/stage-timer";

/**
 * Memory Node: Used when the query is purely conversational.
 * Clears out any old context to avoid polluting the prompt.
 */
export async function memoryAgent(state: typeof GraphState.State) {
  const stageStart = StageTimer.start("memoryNode");
  let cacheHit = false;
  let errorOccurred = false;

  try {
    // If no retrieval is needed, we just clear the citations so the LLM
    // replies naturally based only on conversation history.
    const result = {
      retrievedChunks: [],
      formattedCitations: "No context needed for this query. Reply conversationally.",
      finalPrompt: "You are a helpful AI assistant. Answer the user conversationally.",
    };

    const { durationMs } = StageTimer.end("memoryNode", stageStart, {
      organizationId: state.organizationId,
      userId: state.userId,
      cacheHit,
    });
    return { ...result, timings: { memoryNode: durationMs } };
  } catch (err) {
    errorOccurred = true;
    const { durationMs } = StageTimer.end("memoryNode", stageStart, {
      organizationId: state.organizationId,
      userId: state.userId,
      cacheHit,
    }, true);
    return {
      retrievedChunks: [],
      formattedCitations: "No context needed for this query. Reply conversationally.",
      finalPrompt: "You are a helpful AI assistant. Answer the user conversationally.",
      timings: { memoryNode: durationMs },
    };
  }
}
