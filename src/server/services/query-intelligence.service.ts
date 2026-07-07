import { llm } from "@/ai/llm/openrouter";

export class QueryIntelligenceService {
  /**
   * Rewrites a user query to resolve ambiguities, pronouns, or shorthand terms.
   * If chat history is provided, resolves conversational references (e.g. "tell me more about it").
   *
   * @param query - The raw user query
   * @param chatHistory - Array of previous chat messages
   * @returns Rewritten query text
   */
  static async rewriteQuery(
    query: string,
    chatHistory: Array<{ role: "user" | "assistant"; content: string }> = []
  ): Promise<string> {
    if (!query.trim()) return "";

    try {
      const historyText = chatHistory.length > 0
        ? chatHistory
            .slice(-4) // Take only the last 4 turns to prevent bloating
            .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
            .join("\n")
        : "None";

      const prompt = `
You are an expert search query refiner.
Your job is to rewrite the User Query to be a clear, self-contained search query.
Resolve any pronouns ("it", "they", "this", "that"), abbreviations, or context dependencies.
Refer to the Chat History only to resolve context dependencies; do NOT summarize or answer the query.
If the query is already self-contained and clear, output it exactly as is.

CRITICAL: Return ONLY the rewritten query text. Do not include markdown code blocks, prefixes (like "Rewritten query:"), or extra explanations.

Chat History:
${historyText}

User Query: "${query}"
`;

      const response = await llm.invoke(prompt);
      const rewritten = response.content.toString().trim();

      // Strip out any accidental markdown code block formatting
      return rewritten.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();
    } catch (error) {
      console.error("[QueryIntelligenceService] Query rewriting failed, using original:", error);
      return query;
    }
  }

  /**
   * Generates multiple query variants/variations using synonyms or alternate phrasings.
   * This is used for multi-query retrieval to maximize search recall in vector and BM25 searches.
   *
   * @param query - The rewritten query
   * @param limit - Number of variants to generate
   * @returns Array of query variants
   */
  static async generateVariants(
    query: string,
    limit: number = 3
  ): Promise<string[]> {
    if (!query.trim()) return [];

    try {
      const prompt = `
You are a search expansion system.
Generate exactly ${limit} search query variations of the User Query.
Use synonyms, alternate formulations, or different keywords to capture the user's intent from different angles.
This will be used for both vector and keyword-based retrieval to maximize search recall.

CRITICAL: Return ONLY a valid JSON array of strings containing the query variations. Do not include markdown blocks, numbering, or extra text.
Example Output: ["variation 1", "variation 2", "variation 3"]

User Query: "${query}"
`;

      const response = await llm.invoke(prompt);
      const content = response.content.toString().trim();

      try {
        const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          return parsed.map((v) => String(v).trim()).filter(Boolean).slice(0, limit);
        }
      } catch (err) {
        console.warn("[QueryIntelligenceService] Failed to parse generated variations JSON:", content);
      }

      // Safe fallback if JSON parsing fails: split by lines or number prefixes
      const lines = content
        .split("\n")
        .map((l) => l.replace(/^\d+[\.\-\)]\s*/, "").replace(/^[\-\*\+]\s*/, "").trim())
        .filter(Boolean)
        .slice(0, limit);

      return lines.length > 0 ? lines : [query];
    } catch (error) {
      console.error("[QueryIntelligenceService] Multi-query generation failed:", error);
      return [query];
    }
  }
}
