import { VectorPayload } from "./vector.service";

export class CompressionService {
  /**
   * Compresses the context by removing duplicate and highly redundant chunks.
   * Uses exact matching and Jaccard token similarity to maximize information density.
   *
   * @param chunks - The list of retrieved and reranked candidate chunks
   * @param similarityThreshold - Jaccard index limit above which chunks are considered redundant (default 0.5)
   * @returns Deduplicated and compressed chunks
   */
  static compressContext(
    chunks: VectorPayload[],
    similarityThreshold: number = 0.5
  ): VectorPayload[] {
    const uniqueChunks: VectorPayload[] = [];
    const seenTexts = new Set<string>();

    for (const chunk of chunks) {
      // 1. Normalize text to remove differences in spacing/newlines
      const normalizedText = chunk.chunkText.replace(/\s+/g, " ").trim();

      // 2. Exact match deduplication (hash/Set lookup)
      if (seenTexts.has(normalizedText)) {
        continue;
      }

      // 3. Semantic redundancy check using token-level Jaccard similarity
      let isRedundant = false;
      for (const existing of uniqueChunks) {
        const similarity = CompressionService.calculateJaccardSimilarity(
          normalizedText,
          existing.chunkText
        );
        
        if (similarity > similarityThreshold) {
          console.log(
            `[CompressionService] Dropped chunk from ${chunk.documentName} ` +
            `due to high redundancy (${Math.round(similarity * 100)}% overlap) ` +
            `with existing chunk from ${existing.documentName}`
          );
          isRedundant = true;
          break;
        }
      }

      if (!isRedundant) {
        seenTexts.add(normalizedText);
        uniqueChunks.push({
          ...chunk,
          chunkText: normalizedText,
        });
      }
    }

    return uniqueChunks;
  }

  /**
   * Calculates the Jaccard similarity coefficient (word token overlap) between two strings.
   * Jaccard Score = size(intersection) / size(union)
   */
  private static calculateJaccardSimilarity(str1: string, str2: string): number {
    // Split on whitespace and filter out common punctuation/short words
    const tokenize = (str: string) => {
      return new Set(
        str
          .toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
          .split(/\s+/)
          .filter((w) => w.length > 2) // Ignore extremely short noise tokens
      );
    };

    const set1 = tokenize(str1);
    const set2 = tokenize(str2);

    if (set1.size === 0 || set2.size === 0) return 0;

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }
}
