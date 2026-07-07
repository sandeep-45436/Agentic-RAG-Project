import { RetrievalService } from "@/server/services/retrieval.service";

/**
 * Controlled wrapper tool that wraps our production-grade Hybrid RAG pipeline.
 */
export class RetrievalTool {
  static async run(query: string, organizationId: string) {
    if (!query || !organizationId) {
      return [];
    }

    try {
      const result = await RetrievalService.buildContextualPrompt(query, organizationId);
      return result.chunks || [];
    } catch (error) {
      console.error("[RetrievalTool] Failed to run hybrid retrieval:", error);
      return [];
    }
  }
}

