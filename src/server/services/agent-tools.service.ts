import { db } from "@/server/db/prisma";
import { RetrievalService } from "./retrieval.service";
import { Role } from "@prisma/client";

export interface ToolContext {
  userId: string;
  organizationId: string;
  userRole: Role;
}

export class AgentToolsService {
  /**
   * Safe document retrieval tool.
   * Accessible by all user roles (OWNER, ADMIN, MEMBER).
   */
  static async retrieveContextTool(query: string, context: ToolContext) {
    console.log(`[AgentToolsService] Executing retrieveContextTool for query: "${query}"`);
    try {
      const result = await RetrievalService.buildContextualPrompt(query, context.organizationId, []);
      if (!result.prompt) {
        return { success: true, message: "No documents matched the query.", context: "" };
      }
      return {
        success: true,
        message: `Successfully retrieved context from ${result.chunks.length} chunks.`,
        context: result.prompt,
      };
    } catch (error: any) {
      console.error("[AgentToolsService] retrieveContextTool failed:", error);
      throw new Error(`Retrieval tool failed: ${error.message}`);
    }
  }

  /**
   * Safe, read-only SQL statistics tool.
   * Restricted to OWNER and ADMIN roles only.
   */
  static async sqlQueryTool(queryType: "chunk_count" | "document_stats" | "usage_summary", context: ToolContext) {
    console.log(`[AgentToolsService] Executing sqlQueryTool: "${queryType}"`);
    
    // Role-based tool permissions check
    if (context.userRole !== Role.OWNER && context.userRole !== Role.ADMIN) {
      return {
        success: false,
        error: "Permission Denied: Only ADMIN and OWNER roles can execute SQL database queries.",
      };
    }

    try {
      switch (queryType) {
        case "chunk_count": {
          const count = await db.chunk.count({
            where: { organizationId: context.organizationId, deletedAt: null },
          });
          return { success: true, totalChunks: count };
        }
        case "document_stats": {
          const stats = await db.document.groupBy({
            by: ["processingStatus"],
            where: { organizationId: context.organizationId, deletedAt: null },
            _count: true,
          });
          return { success: true, stats };
        }
        case "usage_summary": {
          const summary = await db.usageEvent.count({
            where: { organizationId: context.organizationId },
          });
          return { success: true, totalEventsLogged: summary };
        }
        default:
          return { success: false, error: "Unsupported query type." };
      }
    } catch (error: any) {
      console.error("[AgentToolsService] sqlQueryTool failed:", error);
      throw new Error(`SQL query tool failed: ${error.message}`);
    }
  }

  /**
   * Simulated mock external web search tool.
   * Accessible by all user roles.
   */
  static async webSearchTool(query: string, context: ToolContext) {
    console.log(`[AgentToolsService] Executing webSearchTool for: "${query}"`);
    
    // Simulate lookup of current events or general facts
    const queryLower = query.toLowerCase();
    let resultText = `External web search results for: "${query}":\n`;

    if (queryLower.includes("price") || queryLower.includes("pricing") || queryLower.includes("cost")) {
      resultText += "- Premium SaaS enterprise package is estimated around $149/user/month.\n";
      resultText += "- Starter tiers begin around $19/user/month with standard hybrid RAG indexes.";
    } else if (queryLower.includes("competitor") || queryLower.includes("market")) {
      resultText += "- Competitors like Cohere and Pinecone offer managed RAG infrastructure.\n";
      resultText += "- NexusIQ distinguishes itself with local WASM reranking, DB-trigger full text search, and multi-doc graph paths.";
    } else {
      resultText += `- Found recent references to "${query}" indicating growing enterprise interest in custom LangGraph orchestrations.\n`;
      resultText += "- Standard security protocols prioritize local hybrid search over public web scraping.";
    }

    return {
      success: true,
      query,
      results: resultText,
    };
  }

  /**
   * Decision Intelligence tool for predictive insights.
   */
  static async decisionIntelligenceTool(queryType: "student_risk" | "department_health", context: ToolContext) {
    console.log(`[AgentToolsService] Executing decisionIntelligenceTool: "${queryType}"`);
    const { DecisionIntelligenceService } = await import("./decision-intelligence.service");

    try {
      if (queryType === "student_risk") {
        const assessments = await DecisionIntelligenceService.assessStudentRisk(context.organizationId);
        return { success: true, studentRiskAssessments: assessments };
      } else if (queryType === "department_health") {
        const reports = await DecisionIntelligenceService.evaluateDepartmentHealth(context.organizationId);
        return { success: true, departmentHealthReports: reports };
      }
      return { success: false, error: "Unknown decision intelligence query type." };
    } catch (error: any) {
      console.error("[AgentToolsService] decisionIntelligenceTool failed:", error);
      return { success: false, error: `Decision Intelligence tool failed: ${error.message}` };
    }
  }
}

