import { embeddings } from "@/ai/llm/embeddings";
import { CacheService } from "./cache.service";

export class EmbeddingService {
  /**
   * Generates embeddings for a batch of text chunks.
   * Leverages Redis/in-memory caching for deduplication and batches API requests.
   */
  static async embedBatch(texts: string[], maxRetries = 3): Promise<number[][]> {
    if (texts.length === 0) return [];

    const results: number[][] = new Array(texts.length);
    const cacheMissIndices: number[] = [];
    const cacheMissTexts: string[] = [];

    // 1. Check Caching for each text chunk
    for (let i = 0; i < texts.length; i++) {
      const hash = CacheService.hashKey(texts[i]);
      const cachedVector = await CacheService.get<number[]>(`embedding:${hash}`);
      
      if (cachedVector) {
        results[i] = cachedVector;
      } else {
        cacheMissIndices.push(i);
        cacheMissTexts.push(texts[i]);
      }
    }

    // 2. If there are cache misses, process them in batches of 20
    if (cacheMissTexts.length > 0) {
      const BATCH_SIZE = 20;
      const batches: string[][] = [];
      
      for (let i = 0; i < cacheMissTexts.length; i += BATCH_SIZE) {
        batches.push(cacheMissTexts.slice(i, i + BATCH_SIZE));
      }

      console.log(`[EmbeddingService] Generating embeddings for ${cacheMissTexts.length} chunks (${batches.length} API batches).`);

      let processedCount = 0;
      for (const batch of batches) {
        let attempt = 0;
        let batchVectors: number[][] | null = null;

        while (attempt < maxRetries) {
          try {
            batchVectors = await embeddings.embedDocuments(batch);
            break; // Success
          } catch (error: unknown) {
            attempt++;
            const errMsg = error instanceof Error ? error.message : "Unknown error";
            console.warn(`[EmbeddingService] API attempt ${attempt}/${maxRetries} failed: ${errMsg}`);
            
            if (attempt >= maxRetries) {
              throw new Error(`Failed to generate embeddings: ${errMsg}`);
            }
            
            // Jittered backoff delay: 1.5s, 3.0s...
            const delay = Math.pow(2, attempt) * 800 + Math.random() * 400;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        if (batchVectors) {
          // Put batch results back into main array and cache them
          for (let i = 0; i < batch.length; i++) {
            const originalIndex = cacheMissIndices[processedCount + i];
            results[originalIndex] = batchVectors[i];

            // Cache the generated vector for future reuse (30 days TTL)
            const hash = CacheService.hashKey(batch[i]);
            await CacheService.set(`embedding:${hash}`, batchVectors[i], 86400 * 30);
          }
          processedCount += batch.length;
        }
      }
    }

    return results;
  }
}
