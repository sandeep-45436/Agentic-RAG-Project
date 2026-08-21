import { AgentToolsService, ToolContext } from "@/server/services/agent-tools.service";
import { withTimeout } from "@/ai/utils/with-timeout";

export interface ToolExecutionMetrics {
  totalInvocations: number;
  successfulInvocations: number;
  failedInvocations: number;
  averageDurationMs: number;
}

export class EnterpriseToolRuntime {
  private static metricsMap = new Map<string, { count: number; totalMs: number; errors: number }>();

  public static async executeTool(
    toolName: "vector" | "sql" | "web" | "decision",
    argument: string,
    context: ToolContext,
    timeoutBudgetMs: number = 800
  ): Promise<any> {
    const startTime = Date.now();

    // 1. RBAC Policy Enforcement
    const restrictedTools = ["sql", "decision"];
    const authorizedRoles = ["OWNER", "ADMIN", "DEAN", "FACULTY", "ADVISOR"];
    if (restrictedTools.includes(toolName) && !authorizedRoles.includes(context.userRole as string)) {
      throw new Error(`RBAC Policy Denied: Role '${context.userRole}' cannot execute tool '${toolName}'`);
    }

    // 2. Execution with timeout & retry handling
    let retries = 2;
    let payload: any = null;
    let success = false;
    let lastError: string | undefined;

    while (retries > 0 && !success) {
      try {
        const toolPromise = (async () => {
          if (toolName === "vector") {
            return await AgentToolsService.retrieveContextTool(argument, context);
          } else if (toolName === "sql") {
            const arg = (
              argument.includes("chunk") ? "chunk_count" :
              argument.includes("usage") ? "usage_summary" : "document_stats"
            ) as any;
            return await AgentToolsService.sqlQueryTool(arg, context);
          } else if (toolName === "web") {
            return await AgentToolsService.webSearchTool(argument, context);
          } else if (toolName === "decision") {
            const arg = argument.toLowerCase().includes("department")
              ? "department_health"
              : "student_risk";
            return await AgentToolsService.decisionIntelligenceTool(arg, context);
          }
          throw new Error(`Unknown tool: ${toolName}`);
        })();

        payload = await withTimeout(toolPromise, timeoutBudgetMs, `tool-${toolName}`);
        success = true;
      } catch (err: any) {
        retries--;
        lastError = err.message;
        if (retries === 0) break;
      }
    }

    const durationMs = Date.now() - startTime;

    // Update Metrics
    const currentMetric = EnterpriseToolRuntime.metricsMap.get(toolName) || { count: 0, totalMs: 0, errors: 0 };
    currentMetric.count += 1;
    currentMetric.totalMs += durationMs;
    if (!success) currentMetric.errors += 1;
    EnterpriseToolRuntime.metricsMap.set(toolName, currentMetric);

    // Audit Logging Event
    const auditEvent = {
      event: "ENTERPRISE_TOOL_EXECUTED",
      toolName,
      argument,
      durationMs,
      success,
      error: success ? undefined : lastError,
      organizationId: context.organizationId,
      userId: context.userId,
      timestamp: new Date().toISOString(),
    };
    console.log(JSON.stringify(auditEvent));

    if (!success) {
      throw new Error(`EnterpriseToolRuntime: Tool '${toolName}' execution failed after retries: ${lastError}`);
    }

    return payload;
  }

  public static getMetrics(toolName: string): ToolExecutionMetrics {
    const m = EnterpriseToolRuntime.metricsMap.get(toolName) || { count: 0, totalMs: 0, errors: 0 };
    return {
      totalInvocations: m.count,
      successfulInvocations: m.count - m.errors,
      failedInvocations: m.errors,
      averageDurationMs: m.count > 0 ? m.totalMs / m.count : 0,
    };
  }
}
