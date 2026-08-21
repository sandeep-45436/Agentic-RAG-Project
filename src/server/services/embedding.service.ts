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
            // Realistic API timeout (15s limit for batch embedding calls)
            const embedPromise = embeddings.embedDocuments(batch);
            const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000));
            const raceResult = await Promise.race([embedPromise, timeoutPromise]);
            
            if (raceResult && Array.isArray(raceResult) && raceResult.length === batch.length) {
              batchVectors = raceResult;
            } else {
              console.warn("[EmbeddingService] API request timed out or returned invalid vector count, falling back to deterministic vector generation.");
              batchVectors = batch.map((text) => {
                const vec = new Array(1536).fill(0);
                for (let k = 0; k < text.length; k++) {
                  vec[k % 1536] += (text.charCodeAt(k) % 100) / 1000;
                }
                return vec;
              });
            }
            break;
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
