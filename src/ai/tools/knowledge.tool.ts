import { z } from "zod";
import { RetrievalService } from "@/server/services/retrieval.service";

export const KnowledgeToolSchema = z.object({
  query: z.string().min(1, "Search query cannot be empty"),
  organizationId: z.string().min(1, "Organization ID is required"),
  topK: z.number().optional().default(5),
});

export type KnowledgeToolInput = z.infer<typeof KnowledgeToolSchema>;

export class KnowledgeTool {
  static readonly toolName = "knowledge_retrieval";
  static readonly description = "Searches unstructured policy handbooks, syllabi, course documents, and research papers using hybrid vector + keyword + graph search.";
  static readonly schema = KnowledgeToolSchema;

  static async execute(input: KnowledgeToolInput) {
    const validated = KnowledgeToolSchema.parse(input);

    try {
      const result = await RetrievalService.buildContextualPrompt(
        validated.query,
        validated.organizationId
      );

      return {
        success: true,
        chunks: result.chunks || [],
        debugInfo: result.debugInfo || null,
      };
    } catch (error: any) {
      console.error("[KnowledgeTool] Search execution failed:", error);
      return {
        success: false,
        error: error.message || "Failed to execute knowledge search",
        chunks: [],
        debugInfo: null,
      };
    }
  }
}
