/**
 * ResearchNotebookTool — NexusIQ tool for the Research Bridge.
 *
 * Registered in the existing ToolRegistry and executed through the existing
 * Enterprise Tool Runtime patterns. Does NOT create a new tool runtime.
 *
 * Operations:
 *   CREATE        — create a new research notebook from selected documents
 *   ADD_SOURCE    — add documents to an existing notebook
 *   REMOVE_SOURCE — remove a document from a notebook
 *   SYNC          — re-sync stale/failed sources
 *   GET_STATUS    — retrieve current notebook + source status
 */

import { ResearchNotebookService } from "@/server/services/research-notebook.service";
import { getProviderMeta } from "@/server/research/provider.factory";

export interface ResearchNotebookInput {
  operation: "CREATE" | "ADD_SOURCE" | "REMOVE_SOURCE" | "SYNC" | "GET_STATUS" | "SYNTHESIZE";
  /** Required for CREATE: notebook title */
  title?: string;
  /** Required for CREATE / ADD_SOURCE: document IDs to include */
  documentIds?: string[];
  /** Required for ADD_SOURCE / REMOVE_SOURCE / SYNC / GET_STATUS / SYNTHESIZE */
  notebookId?: string;
  /** Mode for SYNTHESIZE: summary | faq | podcast | study_guide */
  mode?: "summary" | "faq" | "podcast" | "study_guide";
  customPrompt?: string;
  /** Required for REMOVE_SOURCE */
  documentId?: string;
  /** Required for CREATE / ADD_SOURCE / SYNC — resolved server-side RBAC context */
  userContext: {
    userId: string;
    organizationId: string;
    departmentId: string | null;
    collegeId: string | null;
    userRole: string;
  };
  description?: string;
}

export class ResearchNotebookTool {
  static readonly toolName = "research_notebook";
  static readonly description =
    "Create or manage a NexusIQ Research Workspace for deep multi-document analysis, cross-document synthesis, and evidence-grounded study guides or podcasts. " +
    "Use when the user asks to create a research workspace or analyze multiple documents together.";

  static readonly schema = {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["CREATE", "ADD_SOURCE", "REMOVE_SOURCE", "SYNC", "GET_STATUS", "SYNTHESIZE"],
        description: "The operation to perform on the research notebook",
      },
      title: { type: "string", description: "Notebook title (required for CREATE)" },
      documentIds: {
        type: "array",
        items: { type: "string" },
        description: "NexusIQ document IDs (required for CREATE and ADD_SOURCE)",
      },
      notebookId: {
        type: "string",
        description: "Existing notebook ID (required for ADD_SOURCE, REMOVE_SOURCE, SYNC, GET_STATUS, SYNTHESIZE)",
      },
      mode: {
        type: "string",
        enum: ["summary", "faq", "podcast", "study_guide"],
        description: "Synthesis mode for SYNTHESIZE operation",
      },
      customPrompt: { type: "string", description: "Optional specific question or prompt for SYNTHESIZE" },
      documentId: { type: "string", description: "Single document ID (required for REMOVE_SOURCE)" },
      description: { type: "string", description: "Optional notebook description (for CREATE)" },
    },
    required: ["operation", "userContext"],
  };

  static async execute(input: ResearchNotebookInput): Promise<any> {
    const { operation, userContext } = input;

    // Security: userContext MUST be injected by the tool caller (server-side only)
    // The LLM-provided input fields are limited to operation, title, documentIds, notebookId
    if (!userContext?.userId || !userContext?.organizationId) {
      throw new Error("[ResearchNotebookTool] userContext is required and must be server-resolved");
    }

    const providerMeta = getProviderMeta();

    switch (operation) {
      case "CREATE": {
        if (!input.title) throw new Error("title is required for CREATE");
        if (!input.documentIds?.length) throw new Error("documentIds is required for CREATE");
        const notebook = await ResearchNotebookService.createResearchNotebook(
          userContext,
          input.title,
          input.description,
          input.documentIds
        );
        return {
          operation,
          notebook,
          provider: providerMeta,
          message: providerMeta.isDevelopmentMode
            ? "NexusIQ Research Workspace created (Development mode — Mock provider)"
            : "NexusIQ Research Workspace created (Gemini 2.5 Flash / Authorized Evidence Grounding)",
        };
      }

      case "ADD_SOURCE": {
        if (!input.notebookId) throw new Error("notebookId is required for ADD_SOURCE");
        if (!input.documentIds?.length) throw new Error("documentIds is required for ADD_SOURCE");
        const result = await ResearchNotebookService.addDocumentsToNotebook(
          userContext,
          input.notebookId,
          input.documentIds
        );
        return { operation, ...result };
      }

      case "REMOVE_SOURCE": {
        if (!input.notebookId) throw new Error("notebookId is required for REMOVE_SOURCE");
        if (!input.documentId) throw new Error("documentId is required for REMOVE_SOURCE");
        await ResearchNotebookService.removeDocumentFromNotebook(
          userContext,
          input.notebookId,
          input.documentId
        );
        return { operation, success: true };
      }

      case "SYNC": {
        if (!input.notebookId) throw new Error("notebookId is required for SYNC");
        await ResearchNotebookService.syncNotebook(userContext, input.notebookId);
        return { operation, success: true, message: "Sync triggered" };
      }

      case "GET_STATUS": {
        if (!input.notebookId) throw new Error("notebookId is required for GET_STATUS");
        const status = await ResearchNotebookService.getNotebookStatus(userContext, input.notebookId);
        return { operation, ...status, provider: providerMeta };
      }

      case "SYNTHESIZE": {
        if (!input.notebookId) throw new Error("notebookId is required for SYNTHESIZE");
        const result = await ResearchNotebookService.synthesizeNotebook(
          userContext,
          input.notebookId,
          input.mode,
          input.customPrompt
        );
        return { operation, ...result, provider: providerMeta };
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
}
