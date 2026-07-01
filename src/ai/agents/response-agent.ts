import { GraphState } from "../graph/state";
import { PromptService } from "@/server/services/prompt.service";
import { getMessageText } from "@/lib/utils";

/**
 * Response Node: Assembles the final grounded prompt combining the user query 
 * and the formatted citations.
 */
export async function responseAgent(state: typeof GraphState.State) {
  const { messages, formattedCitations } = state;
  const latestMessage = messages[messages.length - 1];

  if (!latestMessage) {
    return { finalPrompt: "No query provided." };
  }

  const query = getMessageText(latestMessage);

  const finalPrompt = PromptService.assembleGroundedPrompt(query, formattedCitations);

  return { finalPrompt };
}
