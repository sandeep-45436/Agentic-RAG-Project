import { StageTimer } from "./stage-timer";

/**
 * Pipeline Benchmark — measures actual P95 latencies per stage.
 *
 * Don't claim targets are achieved until actually measured.
 * Benchmark before optimization.
 */

export interface BenchmarkMetric {
  name: string;
  targetMs?: number;
  targetValue?: number;
  actualMs?: number;
  actualValue?: number;
  passed: boolean;
  notes?: string;
}

export interface BenchmarkReport {
  timestamp: string;
  organizationId: string;
  metrics: BenchmarkMetric[];
  overallPassed: boolean;
  summary: string;
}

export const BENCHMARK_TARGETS = {
  retrieval_p95_ms: 300,
  reranking_p95_ms: 300,
  database_p95_ms: 200,
  planner_p95_ms: 500,
  first_token_latency_ms: 700,
  simple_query_e2e_ms: 2000,
  complex_query_e2e_ms: 8000,
  retrieval_recall_at_5: 0.90,
  groundedness: 0.90,
  unauthorized_tool_execution: 0,
  tenant_leakage: 0,
} as const;

export class PipelineBenchmark {
  /**
   * Creates a benchmark report template with all target metrics.
   * Actual measurements are populated by running test queries through
   * the full pipeline and collecting StageTimer / EvaluationService results.
   */
  static createReportTemplate(organizationId: string): BenchmarkReport {
    const metrics: BenchmarkMetric[] = [
      {
        name: "Retrieval P95",
        targetMs: BENCHMARK_TARGETS.retrieval_p95_ms,
        passed: false,
        notes: "Measured from RetrievalService.buildContextualPrompt()",
      },
      {
        name: "Reranking P95",
        targetMs: BENCHMARK_TARGETS.reranking_p95_ms,
        passed: false,
        notes: "Measured from RerankService.rerank()",
      },
      {
        name: "Database P95",
        targetMs: BENCHMARK_TARGETS.database_p95_ms,
        passed: false,
        notes: "Measured from DatabaseAgent tool execution",
      },
      {
        name: "Planner P95",
        targetMs: BENCHMARK_TARGETS.planner_p95_ms,
        passed: false,
        notes: "Measured from unifiedPlannerNode",
      },
      {
        name: "Final Generation TTFT",
        targetMs: BENCHMARK_TARGETS.first_token_latency_ms,
        passed: false,
        notes: "Measured from streamText() first token",
      },
      {
        name: "Simple Query E2E",
        targetMs: BENCHMARK_TARGETS.simple_query_e2e_ms,
        passed: false,
        notes: "Full pipeline (SIMPLE path)",
      },
      {
        name: "Complex Query E2E",
        targetMs: BENCHMARK_TARGETS.complex_query_e2e_ms,
        passed: false,
        notes: "Full pipeline (COMPLEX path)",
      },
      {
        name: "Retrieval Recall@5",
        targetValue: BENCHMARK_TARGETS.retrieval_recall_at_5,
        passed: false,
        notes: "Measured from EvaluationService",
      },
      {
        name: "Groundedness",
        targetValue: BENCHMARK_TARGETS.groundedness,
        passed: false,
        notes: "Measured from KnowledgeConfidenceEngine",
      },
      {
        name: "Unauthorized Tool Execution",
        targetValue: BENCHMARK_TARGETS.unauthorized_tool_execution,
        passed: true, // Passes until a violation is detected
        notes: "Measured from EnterpriseToolRuntime RBAC audit",
      },
      {
        name: "Tenant Leakage",
        targetValue: BENCHMARK_TARGETS.tenant_leakage,
        passed: true, // Passes until a violation is detected
        notes: "Measured from BaseRepository organization filter",
      },
    ];

    return {
      timestamp: new Date().toISOString(),
      organizationId,
      metrics,
      overallPassed: false,
      summary: "Benchmark template created. Run test queries to populate actual measurements.",
    };
  }

  /**
   * Records a timing measurement against the report.
   */
  static recordTiming(
    report: BenchmarkReport,
    metricName: string,
    actualMs: number
  ): void {
    const metric = report.metrics.find((m) => m.name === metricName);
    if (!metric) return;

    metric.actualMs = actualMs;
    if (metric.targetMs !== undefined) {
      metric.passed = actualMs <= metric.targetMs;
    }

    report.overallPassed = report.metrics.every((m) => m.passed);
    report.summary = report.overallPassed
      ? "All benchmark targets met."
      : `${report.metrics.filter((m) => !m.passed).length} metric(s) below target.`;
  }

  /**
   * Records a quality measurement against the report.
   */
  static recordQuality(
    report: BenchmarkReport,
    metricName: string,
    actualValue: number
  ): void {
    const metric = report.metrics.find((m) => m.name === metricName);
    if (!metric) return;

    metric.actualValue = actualValue;
    if (metric.targetValue !== undefined) {
      // For "unauthorized" and "tenant leakage", target is 0 (lower is better)
      if (metricName === "Unauthorized Tool Execution" || metricName === "Tenant Leakage") {
        metric.passed = actualValue <= metric.targetValue;
      } else {
        metric.passed = actualValue >= metric.targetValue;
      }
    }

    report.overallPassed = report.metrics.every((m) => m.passed);
    report.summary = report.overallPassed
      ? "All benchmark targets met."
      : `${report.metrics.filter((m) => !m.passed).length} metric(s) below target.`;
  }
}
