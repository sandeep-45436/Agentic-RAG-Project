import { VectorPayload } from "@/server/services/vector.service";
import { CitationGroundingValidator, CitationGroundingReport } from "./citation-grounding-validator";

export interface EvidenceVerificationReport {
  verifiedChunks: VectorPayload[];
  rejectedCount: number;
  hasContradiction: boolean;
  verificationLog: string[];
  groundingReport?: CitationGroundingReport;
  recommendedAction: "PASS" | "REGENERATE" | "PARTIAL_RESPONSE" | "REJECT";
}

export class EvidenceVerifier {
  public static verifyEvidence(
    chunks: VectorPayload[],
    minScoreThreshold: number = 0.40,
    responseText?: string,
    dbRecordsCount: number = 0
  ): EvidenceVerificationReport {
    const verifiedChunks: VectorPayload[] = [];
    const verificationLog: string[] = [];
    let rejectedCount = 0;
    let hasContradiction = false;

    for (const chunk of chunks) {
      const score = (chunk as any).score ?? 0.80;
      const chunkId = (chunk as any).id || chunk.chunkId || "unknown";

      if (score < minScoreThreshold) {
        rejectedCount++;
        verificationLog.push(`Rejected chunk ${chunkId}: score ${score} below threshold ${minScoreThreshold}`);
      } else {
        verifiedChunks.push(chunk);
      }
    }

    const textAgg = verifiedChunks.map((c) => ((c as any).text || c.chunkText || "").toLowerCase()).join(" ");
    if (textAgg.includes("mandatory") && textAgg.includes("optional")) {
      hasContradiction = true;
      verificationLog.push("Potential contradiction detected: conflicting mandatory/optional policy statements");
    }

    let groundingReport: CitationGroundingReport | undefined;
    let recommendedAction: "PASS" | "REGENERATE" | "PARTIAL_RESPONSE" | "REJECT" = "PASS";

    if (responseText) {
      groundingReport = CitationGroundingValidator.validateCitationGrounding(
        responseText,
        verifiedChunks,
        dbRecordsCount
      );
      recommendedAction = groundingReport.recommendedAction;
      verificationLog.push(
        `Grounding validation: score ${(groundingReport.groundingScore * 100).toFixed(1)}%, action: ${recommendedAction}`
      );
    } else if (verifiedChunks.length === 0 && dbRecordsCount === 0) {
      recommendedAction = "REJECT";
    }

    return {
      verifiedChunks,
      rejectedCount,
      hasContradiction,
      verificationLog,
      groundingReport,
      recommendedAction,
    };
  }
}

