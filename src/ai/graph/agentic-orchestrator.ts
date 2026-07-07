import { AgentToolsService, ToolContext } from "@/server/services/agent-tools.service";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { db } from "@/server/db/prisma";

export interface SubTask {
  tool: "vector" | "sql" | "web";
  argument: string;
  description: string;
}

export interface OrchestrationState {
  query: string;
  plan: SubTask[];
  currentTaskIndex: number;
  toolsExecuted: string[];
  contextCollected: string;
  iterations: number;
  finalAnswer: string | null;
  logs: string[];
}

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export class AgenticOrchestrator {
  /**
   * Executes a multi-turn agentic planning and tool execution workflow.
   *
   * @param query - The user's research query
   * @param context - Auth credentials and tenant boundaries
   * @returns Synthesized output and execution stats
   */
  static async run(query: string, context: ToolContext) {
    const state: OrchestrationState = {
      query,
      plan: [],
      currentTaskIndex: 0,
      toolsExecuted: [],
      contextCollected: "",
      iterations: 0,
      finalAnswer: null,
      logs: [],
    };

    console.log(`[AgenticOrchestrator] Starting orchestration for query: "${query}"`);
    state.logs.push("Initializing Orchestrator state.");

    // Turn 1: Planner Node
    await AgenticOrchestrator.plannerNode(state);

    // Iteration loop (Supervisor/Executor nodes)
    const MAX_ITERATIONS = 5;
    while (state.finalAnswer === null && state.iterations < MAX_ITERATIONS) {
      state.iterations++;
      state.logs.push(`Iteration ${state.iterations}: Evaluating next step.`);
      
      // Supervisor check
      const decision = AgenticOrchestrator.supervisorNode(state);

      if (decision === "EXECUTE_TOOL") {
        await AgenticOrchestrator.executorNode(state, context);
      } else if (decision === "PLAN_COMPLETE") {
        await AgenticOrchestrator.synthesizerNode(state);
      } else {
        state.logs.push("Safety limit triggered. Generating fallback answer.");
        await AgenticOrchestrator.synthesizerNode(state);
      }
    }

    // Persist agent run details
    try {
      await db.agentRun.create({
        data: {
          query: state.query,
          toolsUsed: state.toolsExecuted,
          iterations: state.iterations,
          organizationId: context.organizationId,
        },
      });
    } catch (dbErr) {
      console.error("[AgenticOrchestrator] Failed to save agent run logs:", dbErr);
    }

    return {
      answer: state.finalAnswer || "I could not formulate an answer.",
      iterations: state.iterations,
      toolsExecuted: state.toolsExecuted,
      logs: state.logs,
      plan: state.plan,
    };
  }

  /**
   * Planner Node: Analyzes the query and generates a step-by-step tool plan.
   */
  private static async plannerNode(state: OrchestrationState) {
    state.logs.push("Planner Node: Formulating execution plan.");

    const prompt = `
You are the lead planner agent for an enterprise AI workspace.
Your task is to break down the user query into a sequence of sub-tasks using the following available tools:
1. "vector": For semantic document retrieval (use this to look up user uploads/policies).
2. "sql": For querying workspace database statistics (e.g. counting chunks, files, upload summaries).
3. "web": For external web search comparisons (pricing, competitor info, market trends).

Analyze the QUERY and output a JSON array representing the plan.
Return ONLY a valid JSON array, without markdown fences or descriptions.

Example query: "How many files have I uploaded, and what are the competitor pricing packages?"
Plan output:
[
  {"tool": "sql", "argument": "document_stats", "description": "Fetch count and statuses of uploaded files"},
  {"tool": "web", "argument": "SaaS RAG pricing packages", "description": "Search web for SaaS pricing structures"}
]

USER QUERY:
"${state.query}"
`;

    try {
      const response = await generateText({
        model: openrouter("google/gemini-2.5-flash"),
        prompt,
        temperature: 0.1,
      });

      const clean = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
      const plan = JSON.parse(clean);

      if (Array.isArray(plan)) {
        state.plan = plan as SubTask[];
        state.logs.push(`Planner Node: Created plan with ${plan.length} sub-tasks.`);
      } else {
        throw new Error("Plan is not an array");
      }
    } catch (e) {
      console.warn("[AgenticOrchestrator] Planner failed, using default fallback plan:", e);
      // Fallback: Default to document retrieval and web search
      state.plan = [
        { tool: "vector", argument: state.query, description: "Lookup matching document context" },
        { tool: "web", argument: state.query, description: "Check external benchmarks" },
      ];
      state.logs.push("Planner Node: Using fallback plan (vector + web).");
    }
  }

  /**
   * Supervisor Node: Decides if we execute the next tool or synthesize the answer.
   */
  private static supervisorNode(state: OrchestrationState): "EXECUTE_TOOL" | "PLAN_COMPLETE" | "HALT" {
    if (state.currentTaskIndex < state.plan.length) {
      return "EXECUTE_TOOL";
    }
    return "PLAN_COMPLETE";
  }

  /**
   * Executor Node: Executes a sub-task with retry handling and role permissions.
   */
  private static async executorNode(state: OrchestrationState, context: ToolContext) {
    const task = state.plan[state.currentTaskIndex];
    state.logs.push(`Executor Node: Running step ${state.currentTaskIndex + 1}/${state.plan.length} (${task.tool}).`);

    let retries = 2;
    let success = false;
    let resultPayload: any = null;

    while (retries > 0 && !success) {
      try {
        if (task.tool === "vector") {
          resultPayload = await AgentToolsService.retrieveContextTool(task.argument, context);
          success = true;
        } else if (task.tool === "sql") {
          // SQL query tool (valid arguments: chunk_count, document_stats, usage_summary)
          const arg = (task.argument.includes("chunk") ? "chunk_count" : 
                       task.argument.includes("usage") ? "usage_summary" : "document_stats") as any;
          resultPayload = await AgentToolsService.sqlQueryTool(arg, context);
          success = true;
        } else if (task.tool === "web") {
          resultPayload = await AgentToolsService.webSearchTool(task.argument, context);
          success = true;
        }
      } catch (err: any) {
        retries--;
        state.logs.push(`Executor Warning: Tool failed. Retrying... (${retries} left). Error: ${err.message}`);
        if (retries === 0) {
          resultPayload = { success: false, error: `Tool execution failed: ${err.message}` };
        }
      }
    }

    // Accumulate metrics and outputs
    state.toolsExecuted.push(task.tool);
    if (resultPayload.success === false) {
      state.logs.push(`Executor Node: Completed with warning - ${resultPayload.error || resultPayload.message}`);
      state.contextCollected += `\n[Tool: ${task.tool} - Error/Warning]\n${resultPayload.error || resultPayload.message}\n`;
    } else {
      state.logs.push(`Executor Node: Successfully completed task.`);
      state.contextCollected += `\n[Tool: ${task.tool} Output]\n${JSON.stringify(resultPayload)}\n`;
    }

    state.currentTaskIndex++;
  }

  /**
   * Synthesizer Node: Final node that aggregates all outputs and generates the final answer.
   */
  private static async synthesizerNode(state: OrchestrationState) {
    state.logs.push("Synthesizer Node: Formulating final response.");

    const prompt = `
You are the final synthesizer agent for an enterprise AI workspace.
Your task is to answer the USER QUERY using the accumulated CONTEXT COLLECTED from our tools (SQL database, vector RAG documents, and web searches).

USER QUERY:
"${state.query}"

CONTEXT COLLECTED:
${state.contextCollected}

Format your response in a highly professional, well-structured layout suitable for executives. If there were errors or permission restrictions during retrieval, note them clearly. Cite sources if appropriate.
`;

    try {
      const response = await generateText({
        model: openrouter("google/gemini-2.5-flash"),
        prompt,
        temperature: 0.3,
      });

      state.finalAnswer = response.text;
      state.logs.push("Synthesizer Node: Successfully compiled response.");
    } catch (e: any) {
      state.finalAnswer = `Orchestration complete, but final synthesis failed: ${e.message}`;
      state.logs.push(`Synthesizer Node: Failed - ${e.message}`);
    }
  }
}
