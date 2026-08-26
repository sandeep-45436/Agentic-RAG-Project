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
    const { retrievedChunks, organizationId, departmentId, collegeId, userRole, userId } = state;

    if (!retrievedChunks || retrievedChunks.length === 0) {
      const { durationMs } = StageTimer.end("citationNode", stageStart, {
        organizationId: state.organizationId,
        userId: state.userId,
        cacheHit,
      });
      return { formattedCitations: "No context provided.", timings: { citationNode: durationMs } };
    }

    // Strict boundary enforcement: verify that chunks strictly belong to authorized departmental / university scope
    const isPrivileged = ["OWNER", "ADMIN", "DEAN"].includes((userRole || "").toUpperCase());
    const authorizedChunks = isPrivileged
      ? retrievedChunks
      : retrievedChunks.filter((chunk) => {
          if (chunk.organizationId !== organizationId) return false;
          const vis = chunk.visibility || (chunk.metadata as any)?.visibility || "DEPARTMENT";
          if (vis === "UNIVERSITY") return true;
          if (vis === "DEPARTMENT") {
            const chunkDept = chunk.departmentId || (chunk.metadata as any)?.departmentId;
            return Boolean(departmentId && chunkDept === departmentId);
          }
          if (vis === "COLLEGE") {
            const chunkCollege = chunk.collegeId || (chunk.metadata as any)?.collegeId;
            return Boolean(collegeId && chunkCollege === collegeId);
          }
          if (vis === "PRIVATE") {
            const uploader = chunk.uploadedBy || (chunk.metadata as any)?.uploadedBy;
            return Boolean(uploader && uploader === userId);
          }
          return false;
        });

    if (authorizedChunks.length === 0) {
      const { durationMs } = StageTimer.end("citationNode", stageStart, {
        organizationId: state.organizationId,
        userId: state.userId,
        cacheHit,
      });
      return {
        formattedCitations: "No authorized departmental context found.",
        retrievedChunks: [],
        timings: { citationNode: durationMs },
      };
    }

    const citationsString = CitationService.formatCitations(authorizedChunks);

    const { durationMs } = StageTimer.end("citationNode", stageStart, {
      organizationId: state.organizationId,
      userId: state.userId,
      cacheHit,
    });
    return {
      formattedCitations: citationsString,
      retrievedChunks: authorizedChunks,
      timings: { citationNode: durationMs },
    };
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
