import { VectorPayload } from "./vector.service";

export class CompressionService {
  /**
   * Compresses the context by removing duplicate chunks and cleaning noise.
   */
  static compressContext(chunks: VectorPayload[]): VectorPayload[] {
    const uniqueChunks: VectorPayload[] = [];
    const seenTexts = new Set<string>();

    for (const chunk of chunks) {
      // Basic normalization to catch slight spacing differences
      const normalizedText = chunk.chunkText.replace(/\s+/g, ' ').trim();
      
      if (!seenTexts.has(normalizedText)) {
        seenTexts.add(normalizedText);
        
        // Clean up the text in the payload for the final prompt
        uniqueChunks.push({
          ...chunk,
          chunkText: normalizedText
        });
      }
    }

    return uniqueChunks;
  }
}
