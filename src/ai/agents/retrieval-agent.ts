import { GraphState } from "../graph/state";
import { RetrievalService } from "@/server/services/retrieval.service";
import { getMessageText } from "@/lib/utils";

/**
 * Retrieval Node: Extracts query and invokes the hybrid Retrieval Service,
 * ensuring strict organization filtering and logging debug metrics.
 */
export async function retrievalAgent(state: typeof GraphState.State) {
  const { messages, organizationId } = state;
  const latestMessage = messages[messages.length - 1];
  
  if (!latestMessage || !organizationId) {
    return { retrievedChunks: [], retrievalDebugInfo: null };
  }

  const query = getMessageText(latestMessage);

  try {
    // Extract history of the last few messages for query refinement
    const chatHistory = messages
      .slice(0, -1) // Exclude the current query itself
      .map((msg) => ({
        role: (msg as any).role === "user" ? "user" as const : "assistant" as const,
        content: getMessageText(msg),
        citations: (msg as any).citations ?? null,
      }));

    // Invoke the controlled hybrid retrieval service with history
    const result = await RetrievalService.buildContextualPrompt(query, organizationId, chatHistory);
    
    return { 
      retrievedChunks: result.chunks || [], 
      retrievalDebugInfo: result.debugInfo || null 
    };
  } catch (error) {
    console.error("[retrievalAgent] Controlled retrieval failed:", error);
    return { retrievedChunks: [], retrievalDebugInfo: null };
  }
}

