import { GraphState } from "../graph/state";
import { CitationService } from "@/server/services/citation.service";
import { StageTimer } from "@/ai/instrumentation/stage-timer";

/**
 * Citation Node: Takes retrieved chunks, validates them, and builds a strict
 * formatted citation string for the LLM context.
 */
export async function citationAgent(state: typeof GraphState.State) {
  const stageStart = StageTimer.start("citationNode");
  let cacheHit = false;
  let errorOccurred = false;

  try {
    const { retrievedChunks } = state;

    if (!retrievedChunks || retrievedChunks.length === 0) {
      const { durationMs } = StageTimer.end("citationNode", stageStart, {
        organizationId: state.organizationId,
        userId: state.userId,
        cacheHit,
      });
      return { formattedCitations: "No context provided.", timings: { citationNode: durationMs } };
    }

    const citationsString = CitationService.formatCitations(retrievedChunks);

    const { durationMs } = StageTimer.end("citationNode", stageStart, {
      organizationId: state.organizationId,
      userId: state.userId,
      cacheHit,
    });
    return { formattedCitations: citationsString, timings: { citationNode: durationMs } };
  } catch (err) {
    errorOccurred = true;
    const { durationMs } = StageTimer.end("citationNode", stageStart, {
      organizationId: state.organizationId,
      userId: state.userId,
      cacheHit,
    }, true);
    return { formattedCitations: "No context provided.", timings: { citationNode: durationMs } };
  }
}
