import { VectorPayload } from "@/server/services/vector.service";

export interface ContextOptimizationReport {
  compressedText: string;
  selectedChunkCount: number;
  originalTokenEstimate: number;
  compressedTokenEstimate: number;
}

export class ContextOptimizer {
  public static optimizeContext(
    chunks: VectorPayload[],
    maxCharBudget: number = 2000
  ): ContextOptimizationReport {
    const sorted = [...chunks].sort(
      (a, b) => ((b as any).score ?? 0.8) - ((a as any).score ?? 0.8)
    );

    let accumulatedText = "";
    let selectedCount = 0;

    for (const chunk of sorted) {
      const text = (chunk as any).text || chunk.chunkText || "";
      const id = (chunk as any).id || chunk.chunkId || "N/A";

      if ((accumulatedText + text).length > maxCharBudget) {
        break;
      }
      accumulatedText += `[Doc ID: ${id}]\n${text.trim()}\n\n`;
      selectedCount++;
    }

    const totalLen = chunks.reduce(
      (acc, c) => acc + ((c as any).text || c.chunkText || "").length,
      0
    );
    const originalTokenEstimate = Math.ceil(totalLen / 4);
    const compressedTokenEstimate = Math.ceil(accumulatedText.length / 4);

    return {
      compressedText: accumulatedText.trim(),
      selectedChunkCount: selectedCount,
      originalTokenEstimate,
      compressedTokenEstimate,
    };
  }
}
