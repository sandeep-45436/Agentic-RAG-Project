import { VectorPayload } from "./vector.service";

export class CitationService {
  /**
   * Formats the compressed payloads into a strict citation block for the LLM prompt.
   */
  static formatCitations(chunks: VectorPayload[]): string {
    if (chunks.length === 0) return "No context provided.";

    return chunks.map((chunk, index) => {
      // Create a clear, traceable citation block
      return `[Citation ID: ${index + 1}]\nSource: ${chunk.documentName || "Unknown Document"} (Chunk: ${chunk.chunkIndex})\nContent:\n${chunk.chunkText}`;
    }).join("\n\n------------------------\n\n");
  }
}
