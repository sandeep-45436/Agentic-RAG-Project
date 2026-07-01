import { GraphState } from "../graph/state";

/**
 * Memory Node: Used when the query is purely conversational.
 * Clears out any old context to avoid polluting the prompt.
 */
export async function memoryAgent(state: typeof GraphState.State) {
  // If no retrieval is needed, we just clear the citations so the LLM 
  // replies naturally based only on conversation history.
  return { 
    retrievedChunks: [], 
    formattedCitations: "No context needed for this query. Reply conversationally.",
    finalPrompt: "You are a helpful AI assistant. Answer the user conversationally."
  };
}
