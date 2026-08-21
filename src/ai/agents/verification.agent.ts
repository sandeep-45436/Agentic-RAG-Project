import { GraphState } from "../graph/state";
import { StageTimer } from "@/ai/instrumentation/stage-timer";
import { EvidenceVerifier } from "@/ai/knowledge/evidence-verifier";

/**
 * Verification Agent Node: Verifies that context payloads gathered across Knowledge, Database,
 * and Workflow agents are sufficiently grounded and ready for prompt synthesis.
 */
export async function verificationAgent(state: typeof GraphState.State) {
  const stageStart = StageTimer.start("verificationNode");
  let cacheHit = false;
  let errorOccurred = false;

  try {
    const { knowledgeContext, databaseContext, toolOutputs, finalResponse } = state;

    const chunks = knowledgeContext?.chunks || [];
    const dbRecordsCount = databaseContext?.length || 0;
    const toolOutputsCount = toolOutputs?.length || 0;

    const report = EvidenceVerifier.verifyEvidence(
      chunks,
      0.40,
      finalResponse,
      dbRecordsCount
    );

    const totalSources = report.verifiedChunks.length + dbRecordsCount + toolOutputsCount;
    const isGrounded = totalSources > 0 && report.recommendedAction !== "REJECT";

    let confidenceScore = 0.85;
    if (report.verifiedChunks.length > 0) {
      const topChunkScore = report.verifiedChunks[0]?.metadata?.fusionScore ?? 0.8;
      confidenceScore = Math.min(Math.max(topChunkScore * 1.2, 0.5), 0.98);
    }

    if (report.groundingReport) {
      confidenceScore = Number((confidenceScore * report.groundingReport.groundingScore).toFixed(2));
    }

    console.log(
      `[VerificationAgent] Context verification complete. Total sources: ${totalSources}, Grounded: ${isGrounded}, Action: ${report.recommendedAction}, Confidence: ${(confidenceScore * 100).toFixed(1)}%`
    );

    const { durationMs } = StageTimer.end("verificationNode", stageStart, {
      organizationId: state.organizationId,
      userId: state.userId,
      cacheHit,
    });

    return {
      verification: {
        isGrounded,
        confidenceScore: Number(confidenceScore.toFixed(2)),
        hallucinationFlag: !isGrounded || report.hasContradiction,
        recommendedAction: report.recommendedAction,
        unsupportedClaims: report.groundingReport?.unsupportedClaims || [],
        misattributedCitations: report.groundingReport?.misattributedCitations || [],
      },
      timings: { verificationNode: durationMs },
    };
  } catch (err) {
    errorOccurred = true;
    const { durationMs } = StageTimer.end("verificationNode", stageStart, {
      organizationId: state.organizationId,
      userId: state.userId,
      cacheHit,
    }, true);
    return {
      verification: {
        isGrounded: false,
        confidenceScore: 0,
        hallucinationFlag: true,
        recommendedAction: "REJECT",
        unsupportedClaims: ["Verification pipeline failure"],
        misattributedCitations: [],
      },
      timings: { verificationNode: durationMs },
    };
  }
}

