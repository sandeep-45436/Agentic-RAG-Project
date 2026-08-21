import { GraphState } from "@/ai/graph/state";
import { StageTimer } from "@/ai/instrumentation/stage-timer";

/**
 * Combined Merge Agent — merges Knowledge context (policy documents) with
 * Database context (student records) into unified context for the response agent.
 *
 * This node executes after both knowledgeNode and databaseNode complete
 * in the COMBINED cognitive path.
 */
export async function combinedMergeAgent(state: typeof GraphState.State) {
  const stageStart = StageTimer.start("combinedMergeNode");

  const { knowledgeContext, databaseContext, retrievedChunks } = state;

  // Collect knowledge chunks
  const knowledgeChunks = knowledgeContext?.chunks || [];
  const existingChunks = retrievedChunks || [];

  // Merge knowledge chunks into retrievedChunks (if not already there)
  const mergedChunks = [...existingChunks];
  for (const chunk of knowledgeChunks) {
    const isDuplicate = mergedChunks.some(
      (existing) => existing.chunkText === chunk.chunkText
    );
    if (!isDuplicate) {
      mergedChunks.push(chunk);
    }
  }

  // Build combined context summary for database results
  const dbRecords = databaseContext || [];
  let combinedDbSummary = "";
  if (dbRecords.length > 0) {
    combinedDbSummary = dbRecords
      .map((d) => `[Database: ${d.toolName}]\n${JSON.stringify(d.records, null, 2)}`)
      .join("\n\n");
  }

  const { durationMs } = StageTimer.end("combinedMergeNode", stageStart, {
    organizationId: state.organizationId,
    userId: state.userId,
    cacheHit: false,
  });

  console.log(
    JSON.stringify({
      event: "COMBINED_MERGE_COMPLETE",
      knowledgeChunks: knowledgeChunks.length,
      databaseRecords: dbRecords.length,
      mergedChunks: mergedChunks.length,
      durationMs,
      timestamp: new Date().toISOString(),
    })
  );

  return {
    retrievedChunks: mergedChunks,
    timings: { combinedMergeNode: durationMs },
  };
}
