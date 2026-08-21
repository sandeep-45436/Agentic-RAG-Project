import { GraphState } from "../graph/state";
import { llm } from "@/ai/llm/openrouter";
import { IntentClassifier } from "./intent-classifier";
import { getMessageText } from "@/lib/utils";

/**
 * Analysis Agent Node (Phase 3 Chapter 3.5 Intent Recognition Integration):
 * 1. Executes IntentClassifier to extract intent categories (A-E) and domain entities.
 * 2. Checks fast-path conversational regex.
 * 3. Performs single LLM query rewrite, variant generation, and entity extraction.
 */
export async function analysisAgent(state: typeof GraphState.State) {
  const { messages } = state;
  const latestMessage = messages[messages.length - 1];

  if (!latestMessage) {
    return {
      queryAnalysis: {
        isConversational: false,
        intentCategory: "INFORMATION_RETRIEVAL",
        rewrittenQuery: "",
        variants: [],
        entities: [],
        extractedEntities: {},
      },
    };
  }

  const query = getMessageText(latestMessage).trim();
  const intentResult = IntentClassifier.classify(query);

  if (intentResult.category === "GREETING_CONVERSATIONAL") {
    console.log("[AnalysisAgent] IntentClassifier detected GREETING_CONVERSATIONAL. Fast-path routing to MEMORY.");
    return {
      queryAnalysis: {
        isConversational: true,
        intentCategory: intentResult.category,
        rewrittenQuery: query,
        variants: [],
        entities: [],
        extractedEntities: intentResult.entities,
      },
    };
  }

  // Fast-path sub-200ms execution for standard retrieval queries without ambiguous pronouns
  const hasAmbiguousPronoun = /\b(it|this|that|they|them|he|she)\b/i.test(query);
  if (intentResult.isFastPath || (!hasAmbiguousPronoun && messages.length <= 2)) {
    console.log(`[AnalysisAgent] Fast-path sub-200ms query classification (${intentResult.category}).`);
    const extractedEntityValues = Object.values(intentResult.entities).filter((v): v is string => typeof v === "string");
    return {
      queryAnalysis: {
        isConversational: false,
        intentCategory: intentResult.category,
        rewrittenQuery: query,
        variants: [query],
        entities: extractedEntityValues,
        extractedEntities: intentResult.entities,
      },
    };
  }

  try {
    const chatHistory = messages
      .slice(0, -1)
      .slice(-3)
      .map((msg) => `${(msg as any).role === "user" ? "USER" : "ASSISTANT"}: ${getMessageText(msg)}`)
      .join("\n");

    const prompt = `
You are an expert search query analyzer for Smart University Operations.
Process the User Query and return a JSON object with:
1. "isConversational": true if the query is casual chitchat requiring no database/RAG execution.
2. "rewrittenQuery": The refined version resolving all pronouns ("it", "they", "this") based on Chat History.
3. "variants": Array of 2 search query variations for recall expansion.
4. "entities": Array of up to 3 key entities extracted from the query.

Chat History:
${chatHistory || "None"}

User Query: "${query}"

Return ONLY a valid JSON object matching this schema:
{
  "isConversational": boolean,
  "rewrittenQuery": "string",
  "variants": ["string", "string"],
  "entities": ["string", "string", "string"]
}
`;

    console.log("[AnalysisAgent] Running unified query analysis LLM call...");
    const response = await llm.invoke(prompt);
    const content = response.content.toString().trim();

    try {
      const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (parsed && typeof parsed.rewrittenQuery === "string" && Array.isArray(parsed.variants)) {
        console.log("[AnalysisAgent] Unified analysis parsed successfully:", {
          intentCategory: intentResult.category,
          rewrittenQuery: parsed.rewrittenQuery,
          variantsCount: parsed.variants.length,
          extractedEntities: intentResult.entities,
        });

        return {
          queryAnalysis: {
            isConversational: !!parsed.isConversational,
            intentCategory: intentResult.category,
            rewrittenQuery: parsed.rewrittenQuery.trim(),
            variants: parsed.variants.map((v: any) => String(v).trim()).filter(Boolean),
            entities: Array.isArray(parsed.entities)
              ? parsed.entities.map((e: any) => String(e).trim()).filter(Boolean)
              : [],
            extractedEntities: intentResult.entities,
          },
        };
      }
    } catch (parseErr) {
      console.warn("[AnalysisAgent] Failed to parse JSON output. Falling back to default:", content);
    }
  } catch (error) {
    console.error("[AnalysisAgent] Unified query analysis failed:", error);
  }

  // Fallback if everything fails
  return {
    queryAnalysis: {
      isConversational: false,
      intentCategory: intentResult.category,
      rewrittenQuery: query,
      variants: [],
      entities: [],
      extractedEntities: intentResult.entities,
    },
  };
}
