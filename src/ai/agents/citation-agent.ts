import { GraphState } from "../graph/state";
import { CitationService } from "@/server/services/citation.service";

/**
 * Citation Node: Takes retrieved chunks, validates them, and builds a strict 
 * formatted citation string for the LLM context.
 */
export async function citationAgent(state: typeof GraphState.State) {
  const { retrievedChunks } = state;

  if (!retrievedChunks || retrievedChunks.length === 0) {
    return { formattedCitations: "No context provided." };
  }

  const citationsString = CitationService.formatCitations(retrievedChunks);

  return { formattedCitations: citationsString };
}
