import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { VectorPayload } from "@/server/services/vector.service";

/**
 * Defines the strict state object that flows through our LangGraph agents.
 */
export const GraphState = Annotation.Root({
  // The conversation history and current query
  messages: Annotation<BaseMessage[]>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),
  
  // Multi-tenant isolation keys (MANDATORY)
  organizationId: Annotation<string>(),
  userId: Annotation<string>(),
  
  // Routing decision
  routedPath: Annotation<"RETRIEVAL" | "MEMORY">({
    reducer: (curr, update) => update,
    default: () => "RETRIEVAL",
  }),

  // Retrieval payload state
  retrievedChunks: Annotation<VectorPayload[]>({
    reducer: (curr, update) => update,
    default: () => [],
  }),

  // Citation payload state
  formattedCitations: Annotation<string>({
    reducer: (curr, update) => update,
    default: () => "",
  }),

  // Final prompt to send to LLM
  finalPrompt: Annotation<string>({
    reducer: (curr, update) => update,
    default: () => "",
  }),
});
