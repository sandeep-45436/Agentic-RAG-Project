import { NextResponse } from "next/server";
import { PipelineBenchmark } from "@/ai/instrumentation/pipeline-benchmark";
import { ModelConfig } from "@/ai/llm/model-config";

/**
 * GET /api/debug/benchmark
 *
 * Returns a benchmark report template with all target metrics
 * and the current model configuration.
 *
 * Admin-only endpoint for performance auditing.
 */
export async function GET() {
  const report = PipelineBenchmark.createReportTemplate("benchmark-run");

  return NextResponse.json({
    modelConfig: {
      reasoning: ModelConfig.reasoning,
      lightweight: ModelConfig.lightweight,
      evaluation: ModelConfig.evaluation,
      multimodal: ModelConfig.multimodal,
      embedding: ModelConfig.embedding,
      streaming: ModelConfig.streaming,
      failoverChain: ModelConfig.failoverChain,
      baseUrl: ModelConfig.baseUrl,
    },
    benchmark: report,
  });
}
