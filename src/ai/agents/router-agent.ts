import { GraphState } from "../graph/state";
import { llm } from "@/ai/llm/openrouter";
import { getMessageText } from "@/lib/utils";

/**
 * Router Node: Analyzes the conversation to determine if we need to search the vector database
 * or if we can just rely on conversational memory.
 */
export async function routerAgent(state: typeof GraphState.State) {
  const isConversational = state.queryAnalysis?.isConversational;
  if (typeof isConversational === "boolean") {
    console.log(`[RouterAgent] Using pre-computed routing decision: ${isConversational ? "MEMORY" : "RETRIEVAL"}`);
    return { routedPath: isConversational ? ("MEMORY" as const) : ("RETRIEVAL" as const) };
  }

  const messages = state.messages;
  const latestMessage = messages[messages.length - 1];
  
  if (!latestMessage) {
    return { routedPath: "RETRIEVAL" as const };
  }

  const query = getMessageText(latestMessage);
  
  // Fast, cheap LLM call to classify intent
  const prompt = `
You are a routing agent for a SaaS application.
User message: "${query}"

If the user is asking a substantive question that requires looking up documentation, knowledge base articles, or factual information, output exactly: RETRIEVAL
If the user is just saying hello, thanking you, or asking a general conversational question that requires no domain knowledge, output exactly: MEMORY

Output only the word RETRIEVAL or MEMORY.
`;

  try {
    const response = await llm.invoke(prompt);
    const intent = response.content.toString().trim().toUpperCase();
    
    if (intent.includes("MEMORY")) {
      return { routedPath: "MEMORY" as const };
    }
  } catch (error) {
    console.error("[RouterAgent] Routing failed, defaulting to RETRIEVAL", error);
  }

  return { routedPath: "RETRIEVAL" as const };
}
