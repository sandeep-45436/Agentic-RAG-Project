import { ToolContext } from "@/server/services/agent-tools.service";
import { llm } from "@/ai/llm/openrouter";
import { db } from "@/server/db/prisma";
import { generateRecoveryPlan } from "@/ai/graph/unified-planner-node";
import { FailureContext } from "@/ai/graph/state";
import { EnterpriseToolRuntime } from "@/ai/runtime/enterprise-tool-runtime";

export interface SubTask {
  id?: string;
  tool: "vector" | "sql" | "web" | "decision";
  argument: string;
  description: string;
  dependsOn?: string[];
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

    // Build dependency-aware parallel execution batches
    const batches = AgenticOrchestrator.buildExecutionBatches(state.plan);
    state.logs.push(`Orchestrator: executing ${batches.length} batch(es) across ${state.plan.length} task(s).`);

    for (const batch of batches) {
      state.iterations++;
      state.logs.push(`Batch ${state.iterations}: dispatching ${batch.length} task(s) in parallel via EnterpriseToolRuntime.`);
      const batchFailed = await AgenticOrchestrator.executeBatch(batch, context, state);

      if (batchFailed) {
        // Trigger replanning on batch/subtask failure
        const failedTask = batch[0]; // representative failed task
        const failureContext: FailureContext = {
          failedTaskId: failedTask.id || `task-${state.iterations}`,
          failedTaskType: failedTask.tool.toUpperCase(),
          errorMessage: `Subtask execution failed for tool ${failedTask.tool}`,
          attemptedQuery: failedTask.argument,
        };

        const replanEvent = {
          event: "REPLANNING_TRIGGERED",
          failureContext,
          organizationId: context.organizationId,
          userId: context.userId,
          timestamp: new Date().toISOString(),
        };
        console.log(JSON.stringify(replanEvent));
        state.logs.push(`REPLANNING_TRIGGERED for failed task ${failureContext.failedTaskId}`);

        try {
          const recoveryPlan = await generateRecoveryPlan(state.query, failureContext);
          if (recoveryPlan && recoveryPlan.orchestrationReady) {
            state.logs.push(`Executing recovery plan with ${recoveryPlan.subTasks.length} subtask(s).`);
            const recoverySubTasks: SubTask[] = recoveryPlan.subTasks.map((st) => ({
              id: st.id,
              tool: st.type === "DATABASE_QUERY" ? "sql" : "vector",
              argument: st.query,
              description: st.query,
            }));
            await AgenticOrchestrator.executeBatch(recoverySubTasks, context, state);
          } else {
            throw new Error("Recovery plan invalid or unavailable");
          }
        } catch (recoveryErr: any) {
          const failEvent = {
            event: "REPLANNING_FAILED",
            error: recoveryErr.message,
            timestamp: new Date().toISOString(),
          };
          console.log(JSON.stringify(failEvent));
          state.logs.push(`REPLANNING_FAILED: ${recoveryErr.message}. Proceeding with partial context.`);
        }
      }
    }

    // Synthesize after batches complete
    await AgenticOrchestrator.synthesizerNode(state);

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
      const response = await llm.invoke(prompt);
      const text = response.content.toString();
      const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const plan = JSON.parse(clean);

      if (Array.isArray(plan)) {
        state.plan = (plan as SubTask[]).map((st, i) => ({
          ...st,
          id: st.id || `task-${i + 1}`,
        }));
        state.logs.push(`Planner Node: Created plan with ${plan.length} sub-tasks.`);
      } else {
        throw new Error("Plan is not an array");
      }
    } catch (e) {
      console.warn("[AgenticOrchestrator] Planner failed, using default fallback plan:", e);
      state.plan = [
        { id: "task-1", tool: "vector", argument: state.query, description: "Lookup matching document context" },
        { id: "task-2", tool: "web", argument: state.query, description: "Check external benchmarks" },
      ];
      state.logs.push("Planner Node: Using fallback plan (vector + web).");
    }
  }

  /**
   * Synthesizer Node: Aggregates outputs and generates response.
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
      const response = await llm.invoke(prompt);
      state.finalAnswer = response.content.toString();
      state.logs.push("Synthesizer Node: Successfully compiled response.");
    } catch (e: any) {
      state.finalAnswer = `Orchestration complete, but final synthesis failed: ${e.message}`;
      state.logs.push(`Synthesizer Node: Failed - ${e.message}`);
    }
  }

  private static isIndependent(taskA: SubTask, taskB: SubTask): boolean {
    if (taskB.dependsOn && taskA.id && taskB.dependsOn.includes(taskA.id)) return false;
    if (taskA.dependsOn && taskB.id && taskA.dependsOn.includes(taskB.id)) return false;
    if (taskB.argument.includes(taskA.description)) return false;
    if (taskA.argument.includes(taskB.description)) return false;
    return true;
  }

  private static buildExecutionBatches(plan: SubTask[]): SubTask[][] {
    if (plan.length === 0) return [];
    const batches: SubTask[][] = [[plan[0]]];

    for (let i = 1; i < plan.length; i++) {
      const task = plan[i];
      const lastBatch = batches[batches.length - 1];

      const independentOfAll = lastBatch.every((existing) =>
        AgenticOrchestrator.isIndependent(existing, task)
      );

      if (independentOfAll) {
        lastBatch.push(task);
      } else {
        batches.push([task]);
      }
    }

    return batches;
  }

  /**
   * Executes a batch of sub-tasks concurrently via EnterpriseToolRuntime gateway.
   * Returns true if any task in the batch failed.
   */
  private static async executeBatch(
    batch: SubTask[],
    context: ToolContext,
    state: OrchestrationState,
  ): Promise<boolean> {
    let batchFailed = false;

    const executeTask = async (task: SubTask): Promise<any> => {
      return await EnterpriseToolRuntime.executeTool(task.tool, task.argument, context);
    };

    const results = await Promise.allSettled(batch.map((task) => executeTask(task)));

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const task = batch[i];

      if (result.status === "fulfilled") {
        const payload = result.value;
        state.toolsExecuted.push(task.tool);

        if (payload?.success === false) {
          state.contextCollected +=
            `\n[Tool: ${task.tool} - Error/Warning]\n${payload.error || payload.message}\n`;
          state.logs.push(`ExecuteBatch: tool "${task.tool}" completed with warning.`);
        } else {
          state.contextCollected +=
            `\n[Tool: ${task.tool} Output]\n${JSON.stringify(payload)}\n`;
          state.logs.push(`ExecuteBatch: tool "${task.tool}" succeeded.`);
        }
      } else {
        batchFailed = true;
        const errMsg: string =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);

        const event = {
          event: "SUBTASK_FAILURE",
          tool: task.tool,
          description: task.description,
          error: errMsg,
        };
        console.log(JSON.stringify(event));

        state.contextCollected +=
          `\n[Tool: ${task.tool} - FAILED]\nError: ${errMsg}\n`;
        state.logs.push(`ExecuteBatch: SUBTASK_FAILURE for tool "${task.tool}": ${errMsg}`);
      }
    }

    return batchFailed;
  }
}
