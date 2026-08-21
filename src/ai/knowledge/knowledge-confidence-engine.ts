import { VectorPayload } from "@/server/services/vector.service";
import { EvidenceVerificationReport } from "./evidence-verifier";
import { EvidenceGraph } from "./evidence-graph-builder";

export interface KnowledgeConfidenceReport {
  groundednessScore: number;
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
  reasoning: string;
}

export class KnowledgeConfidenceEngine {
  public static computeConfidence(
    chunks: VectorPayload[],
    verification: EvidenceVerificationReport,
    graph: EvidenceGraph
  ): KnowledgeConfidenceReport {
    if (chunks.length === 0) {
      return {
        groundednessScore: 0.0,
        confidenceLevel: "LOW",
        reasoning: "Zero evidence chunks retrieved",
      };
    }

    const avgScore = chunks.reduce((acc, c) => acc + ((c as any).score ?? 0.8), 0) / chunks.length;
    let groundednessScore = avgScore;

    if (verification.hasContradiction) {
      groundednessScore *= 0.70;
    }

    if (graph.nodeCount > 1) {
      groundednessScore = Math.min(1.0, groundednessScore * 1.05);
    }

    const confidenceLevel =
      groundednessScore >= 0.80 ? "HIGH" : groundednessScore >= 0.55 ? "MEDIUM" : "LOW";

    return {
      groundednessScore: parseFloat(groundednessScore.toFixed(2)),
      confidenceLevel,
      reasoning: `Grounded on ${chunks.length} chunk(s) with avg similarity ${avgScore.toFixed(2)}`,
    };
  }
}
