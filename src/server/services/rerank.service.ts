import { llm } from "@/ai/llm/openrouter";
import { VectorPayload } from "./vector.service";

export class RerankService {
  /**
   * Reranks retrieved chunks using a fast LLM to select the most relevant ones.
   */
  static async rerankChunks(query: string, chunks: VectorPayload[], topK: number = 5): Promise<VectorPayload[]> {
    if (chunks.length <= topK) return chunks;

    try {
      const chunksData = chunks.map((chunk, index) => {
        return `[Index: ${index}]\nSource: ${chunk.documentName}\nText: ${chunk.chunkText}`;
      }).join("\n\n---\n\n");

      const prompt = `
You are a relevance scoring engine.
I will give you a User Query and a list of Context Chunks.
Identify the top ${topK} most relevant chunks to accurately answer the User Query.
Return ONLY a valid JSON array containing the indices of the top chunks in order of relevance (most relevant first).
Example Output: [3, 0, 12, 1, 5]
Do not include markdown blocks or any other text, just the raw JSON array.

User Query: "${query}"

Context Chunks:
${chunksData}
`;

      const response = await llm.invoke(prompt);
      const content = response.content.toString().trim();
      
      // Parse the output strictly
      let rankedIndices: number[] = [];
      try {
        // Strip out any accidental markdown blocks the LLM might include
        const cleaned = content.replace(/```json/g, "").replace(/```/g, "");
        rankedIndices = JSON.parse(cleaned);
      } catch (err) {
        console.warn("[RerankService] Failed to parse LLM JSON output. Falling back to naive ranking.", content);
        // Fallback: just take the top K from the original vector search
        return chunks.slice(0, topK);
      }

      // Filter and map back to payloads
      const rerankedPayloads = rankedIndices
        .filter(index => typeof index === "number" && index >= 0 && index < chunks.length)
        .map(index => chunks[index])
        .slice(0, topK);

      // If the LLM failed to return enough or valid indices, fallback safely
      if (rerankedPayloads.length === 0) {
        return chunks.slice(0, topK);
      }

      return rerankedPayloads;
    } catch (error) {
      console.error("[RerankService] Reranking failed. Falling back.", error);
      return chunks.slice(0, topK);
    }
  }
}
