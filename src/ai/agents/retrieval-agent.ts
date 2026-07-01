import { GraphState } from "../graph/state";
import { RetrievalTool } from "../tools/retrieval-tool";
import { getMessageText } from "@/lib/utils";

/**
 * Retrieval Node: Extracts query and invokes the Retrieval Tool, ensuring 
 * strict organization filtering.
 */
export async function retrievalAgent(state: typeof GraphState.State) {
  const { messages, organizationId } = state;
  const latestMessage = messages[messages.length - 1];
  
  if (!latestMessage || !organizationId) {
    return { retrievedChunks: [] };
  }

  const query = getMessageText(latestMessage);

  // Invoke the controlled tool
  const chunks = await RetrievalTool.run(query, organizationId);

  return { retrievedChunks: chunks };
}
