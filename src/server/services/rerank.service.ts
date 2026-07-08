import { llm } from "@/ai/llm/openrouter";
import { VectorPayload } from "./vector.service";

export class RerankService {
  private static rerankerPipeline: any = null;
  private static isInitialized = false;
  private static initError: Error | null = null;

  /**
   * Initializes the local BGE-Reranker WebAssembly pipeline.
   * Singleton pattern to prevent multiple loads of the 270MB model.
   */
  private static async getReranker() {
    if (this.isInitialized) {
      if (this.initError) throw this.initError;
      return this.rerankerPipeline;
    }

    try {
      console.log("[RerankService] Initializing local BGE Cross-Encoder (Xenova/bge-reranker-base)...");
      const { pipeline, env } = await import("@xenova/transformers");
      
      // Ensure we fetch the model from Hugging Face hub and cache it locally
      env.allowLocalModels = false;
      
      this.rerankerPipeline = await pipeline(
        "text-classification",
        "Xenova/bge-reranker-base"
      );
      
      this.isInitialized = true;
      console.log("[RerankService] Local Cross-Encoder loaded successfully.");
      return this.rerankerPipeline;
    } catch (error: any) {
      this.isInitialized = true;
      this.initError = error;
      console.warn("[RerankService] Local Cross-Encoder initialization failed, falling back to LLM reranker:", error.message || error);
      throw error;
    }
  }

  /**
   * Reranks retrieved chunks using a cross-encoder to select the most relevant ones.
   * Prioritizes local BGE cross-encoder (WASM), falling back to fast LLM scoring.
   */
  static async rerankChunks(
    query: string,
    chunks: VectorPayload[],
    topK: number = 5
  ): Promise<VectorPayload[]> {
    if (chunks.length === 0) return [];
    if (chunks.length <= topK) {
      // Still populate scores for debugging observability
      return chunks.map(c => ({
        ...c,
        metadata: {
          ...c.metadata,
          rerankScore: c.metadata?.fusionScore ?? 1.0,
        }
      }));
    }

    try {
      // 1. Try local BGE cross-encoder (WASM) first
      const classifier = await this.getReranker();
      
      // Prepare inputs as query-passage pairs (concatenated with [SEP])
      const inputs = chunks.map((chunk) => `${query} [SEP] ${chunk.chunkText}`);
      
      // Run local inference batch
      console.log(`[RerankService] Running local WASM Cross-Encoder on ${chunks.length} candidates...`);
      const outputs = await classifier(inputs, { topk: null });
      
      const scored = chunks.map((chunk, index) => {
        const score = outputs[index]?.score ?? 0;
        return {
          ...chunk,
          metadata: {
            ...chunk.metadata,
            rerankScore: score,
          },
        };
      });

      // Sort by rerank score descending
      return scored.sort((a, b) => (b.metadata?.rerankScore ?? 0) - (a.metadata?.rerankScore ?? 0)).slice(0, topK);
    } catch (error: any) {
      console.warn("[RerankService] Local reranking failed or disabled, falling back to LLM reranking:", error.message || error);
      
      // 2. Fallback to OpenRouter LLM Reranking
      return this.rerankChunksLLM(query, chunks, topK);
    }
  }

  /**
   * Fallback method using OpenRouter fast LLM judge to rank chunks.
   */
  private static async rerankChunksLLM(
    query: string,
    chunks: VectorPayload[],
    topK: number
  ): Promise<VectorPayload[]> {
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
      
      let rankedIndices: number[] = [];
      try {
        const cleaned = content.replace(/```json/g, "").replace(/```/g, "");
        rankedIndices = JSON.parse(cleaned);
      } catch (err) {
        console.warn("[RerankService] Failed to parse LLM JSON output. Falling back to naive ranking.", content);
        return chunks.slice(0, topK);
      }

      const rerankedPayloads = rankedIndices
        .filter(index => typeof index === "number" && index >= 0 && index < chunks.length)
        .map((index, rank) => {
          const chunk = chunks[index];
          // Mock score based on LLM rank for tracing/debugging
          const score = 1.0 - (rank / topK);
          return {
            ...chunk,
            metadata: {
              ...chunk.metadata,
              rerankScore: score,
            },
          };
        })
        .slice(0, topK);

      if (rerankedPayloads.length === 0) {
        return chunks.slice(0, topK);
      }

      return rerankedPayloads;
    } catch (error) {
      console.error("[RerankService] LLM fallback reranking failed. Safely returning initial slices.", error);
      return chunks.slice(0, topK);
    }
  }
}
