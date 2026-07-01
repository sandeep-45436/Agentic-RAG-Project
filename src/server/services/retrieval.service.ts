import { EmbeddingService } from "./embedding.service";
import { VectorService, VectorPayload } from "./vector.service";
import { RerankService } from "./rerank.service";
import { CompressionService } from "./compression.service";
import { CitationService } from "./citation.service";
import { PromptService } from "./prompt.service";
import { CacheService } from "./cache.service";

export class RetrievalService {
  /**
   * Retrieves context for a user query and builds a grounded prompt.
   * Leverages caching, duplicate chunk compression, and prompt size limits.
   */
  static async buildContextualPrompt(query: string, organizationId: string) {
    if (!query.trim()) throw new Error("Query cannot be empty.");

    const cacheKey = `retrieval:${organizationId}:${CacheService.hashKey(query.trim().toLowerCase())}`;

    try {
      // 1. Try to fetch from cache first (bypasses DB query, embedding call, and reranking)
      const cached = await CacheService.get<{ prompt: string | null; chunks: VectorPayload[] }>(cacheKey);
      if (cached) {
        console.log(`[RetrievalService] Cache HIT for query: "${query}"`);
        return cached;
      }

      console.log(`[RetrievalService] Cache MISS for query: "${query}"`);

      // 2. Embed Query (calls the optimized embedding service)
      const vectors = await EmbeddingService.embedBatch([query], 1);
      if (!vectors || vectors.length === 0) {
        return { prompt: "No embeddings generated.", chunks: [] };
      }
      const queryVector = vectors[0];

      // 3. Retrieve Top 20 Candidates Securely (enforces organizationId filter)
      const top20Results = await VectorService.similaritySearch(queryVector, organizationId, 20);
      const top20Payloads = top20Results.map(hit => hit.payload as VectorPayload);

      if (top20Payloads.length === 0) {
        const result = { prompt: null, chunks: [] };
        await CacheService.set(cacheKey, result, 3600); // cache empty result for 1 hr
        return result;
      }

      // 4. Rerank to Top 5 most relevant
      const top5Payloads = await RerankService.rerankChunks(query, top20Payloads, 5);

      // 5. Compress Context (Remove exact duplicates/noise/extra whitespace)
      const compressedPayloads = CompressionService.compressContext(top5Payloads);

      // 6. Format Citations
      const formattedCitations = CitationService.formatCitations(compressedPayloads);

      // 7. Assemble Grounded Prompt
      const systemPrompt = PromptService.assembleGroundedPrompt(query, formattedCitations);

      const result = {
        prompt: systemPrompt,
        chunks: compressedPayloads 
      };

      // 8. Cache the final built prompt for 30 minutes (1800 seconds)
      await CacheService.set(cacheKey, result, 1800);

      return result;
    } catch (error: unknown) {
      console.error("[RetrievalService] Prompt building failed:", error);
      throw error;
    }
  }
}
