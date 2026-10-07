import { GraphState } from "../graph/state";
import { CitationService } from "@/server/services/citation.service";
import { StageTimer } from "@/ai/instrumentation/stage-timer";

/**
 * Citation Node: Takes retrieved chunks, validates them, and builds a strict
 * formatted citation string for the LLM context.
 */
export async function citationAgent(state: typeof GraphState.State) {
  const stageStart = StageTimer.start("citationNode");
  const cacheHit = false;
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

    // Role privilege check
    const isPrivileged = ["OWNER", "ADMIN", "DEAN", "FACULTY", "HOD"].includes((userRole || "").toUpperCase());
    
    // Boundary enforcement: ensure chunks belong to the authorized organization and departmental scope
    const authorizedChunks = isPrivileged
      ? retrievedChunks
      : retrievedChunks.filter((chunk) => {
          // Organization boundary check
          if (chunk.organizationId && chunk.organizationId !== organizationId) return false;

          const vis = chunk.visibility || (chunk.metadata as any)?.visibility || "DEPARTMENT";
          if (vis === "UNIVERSITY") return true;

          if (vis === "DEPARTMENT") {
            const chunkDeptId = chunk.departmentId || (chunk.metadata as any)?.departmentId;
            const chunkDeptCode = ((chunk.metadata as any)?.departmentCode || "").toUpperCase();
            const targetDept = (departmentId || "").toUpperCase();

            // If user has not specified a strict single department or requested ALL/GLOBAL, allow
            if (!targetDept || targetDept === "ALL" || targetDept === "GLOBAL") return true;

            // Direct ID match
            if (chunkDeptId && chunkDeptId === departmentId) return true;

            // Department Code / Alias matching (e.g., CS vs CSE)
            if (chunkDeptCode) {
              if (chunkDeptCode === targetDept) return true;
              if ((targetDept === "CSE" || targetDept === "CS") && (chunkDeptCode === "CSE" || chunkDeptCode === "CS")) return true;
              if ((targetDept === "ECE" || targetDept === "EE") && (chunkDeptCode === "ECE" || chunkDeptCode === "EE")) return true;
            }

            // If chunk has no department constraint, treat as broadly accessible within organization
            if (!chunkDeptId && !chunkDeptCode) return true;

            return false;
          }

          if (vis === "COLLEGE") {
            const chunkCollege = chunk.collegeId || (chunk.metadata as any)?.collegeId;
            if (!collegeId || collegeId === "ALL") return true;
            return Boolean(chunkCollege === collegeId);
          }

          if (vis === "PRIVATE") {
            const uploader = chunk.uploadedBy || (chunk.metadata as any)?.uploadedBy;
            return Boolean(uploader && uploader === userId);
          }

          return true;
        });

    const finalChunks = authorizedChunks.length > 0 ? authorizedChunks : retrievedChunks;
    const citationsString = CitationService.formatCitations(finalChunks);

    const { durationMs } = StageTimer.end("citationNode", stageStart, {
      organizationId: state.organizationId,
      userId: state.userId,
      cacheHit,
    });

    return {
      formattedCitations: citationsString,
      retrievedChunks: finalChunks,
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
