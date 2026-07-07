import { VectorPayload } from "./vector.service";
import { FusedChunk } from "./fusion.service";

export interface Citation {
  id: number;
  source: string;
  pageNumber: number | null;
  chunkIndex: number;
  confidence: number;
  retrievalMethod: string;
  content: string;
}

export class CitationService {
  /**
   * Formats the compressed payloads into a strict citation block for the LLM prompt.
   */
  static formatCitations(chunks: VectorPayload[]): string {
    if (chunks.length === 0) return "No context provided.";

    return chunks.map((chunk, index) => {
      const pageInfo = chunk.metadata?.pageNumber
        ? ` | Page: ${chunk.metadata.pageNumber}`
        : (chunk as any).pageNumber
          ? ` | Page: ${(chunk as any).pageNumber}`
          : "";
      const confidenceInfo = chunk.metadata?.fusionScore
        ? ` | Confidence: ${(chunk.metadata.fusionScore * 100).toFixed(1)}%`
        : "";

      // Create a clear, traceable citation block
      return `[Citation ID: ${index + 1}]\nSource: ${chunk.documentName || "Unknown Document"} (Chunk: ${chunk.chunkIndex})${pageInfo}${confidenceInfo}\nContent:\n${chunk.chunkText}`;
    }).join("\n\n------------------------\n\n");
  }

  /**
   * Formats FusedChunk results into structured citation objects
   * for the frontend debug panel and API responses.
   */
  static formatStructuredCitations(chunks: FusedChunk[]): Citation[] {
    return chunks.map((chunk, index) => {
      // Determine the retrieval method used
      let method = "hybrid";
      if (chunk.vectorScore !== null && chunk.bm25Score === null) method = "vector";
      if (chunk.vectorScore === null && chunk.bm25Score !== null) method = "bm25";

      return {
        id: index + 1,
        source: chunk.documentName || "Unknown Document",
        pageNumber: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        confidence: chunk.fusionScore,
        retrievalMethod: method,
        content: chunk.chunkText,
      };
    });
  }
}

