import { db } from "@/server/db/prisma";
import { RetrievalService } from "./retrieval.service";
import { EvaluationService } from "./evaluation.service";
import { ModelConfig } from "@/ai/llm/model-config";

export interface EvalMetrics {
  recall5: number;
  mrr: number;
  ndcg5: number;
  precision5: number;
  avgFaithfulness: number;
  avgHallucination: number;
  avgLatencyMs: number;
}

export interface QuestionResult {
  questionId: string;
  question: string;
  retrievedCategories: string[];
  recall5Hit: boolean;
  reciprocalRank: number;
  dcg5: number;
  precision5: number;
  faithfulnessScore: number | null;
  hallucinationScore: number | null;
  latencyMs: number;
}

/**
 * Computes NDCG@K gain for a ranked list of relevance booleans.
 * relevance[0] is top result, relevance[K-1] is Kth result.
 */
function computeNDCG(relevance: boolean[], k: number): number {
  const dcg = relevance.slice(0, k).reduce((acc, rel, i) => {
    return acc + (rel ? 1 / Math.log2(i + 2) : 0);
  }, 0);
  // Ideal DCG: assume the relevant doc(s) are at the top
  const idealCount = Math.min(relevance.filter(Boolean).length, k);
  const idcg = Array.from({ length: idealCount }, (_, i) => 1 / Math.log2(i + 2)).reduce(
    (a, b) => a + b,
    0
  );
  return idcg === 0 ? 0 : dcg / idcg;
}

export class BatchEvaluationService {
  /**
   * Resolves the target organization for evaluation, prioritizing organizations with documents or seed-org-001.
   */
  static async resolveOrganization(userId: string): Promise<string> {
    const memberships = await db.membership.findMany({
      where: { userId, deletedAt: null },
      include: { organization: { include: { _count: { select: { documents: true } } } } },
    });

    if (memberships.length === 0) {
      throw new Error("No organization found for user");
    }

    const preferred =
      memberships.find((m) => m.organizationId === "seed-org-001" || (m.organization?._count?.documents ?? 0) > 0) ||
      memberships[0];

    return preferred.organizationId;
  }

  /**
   * Creates a new evaluation run without blocking, returning the run metadata and question IDs.
   */
  static async createRun(
    organizationId: string,
    options?: {
      preset?: "quick" | "standard" | "full";
      limit?: number;
      difficulty?: "EASY" | "MEDIUM" | "HARD";
      categories?: string[];
    }
  ): Promise<{ runId: string; totalQuestions: number; questionIds: string[] }> {
    // Auto-seed questions if needed
    let questionCount = await db.evalQuestion.count({ where: { organizationId } });
    if (questionCount === 0) {
      const benchmarkQuestions = await db.evalQuestion.findMany({
        where: { organizationId: "seed-org-001" },
      });
      if (benchmarkQuestions.length > 0) {
        await db.evalQuestion.createMany({
          data: benchmarkQuestions.map((q) => ({
            organizationId,
            question: q.question,
            expectedAnswer: q.expectedAnswer,
            relevantCategories: q.relevantCategories,
            intentCategory: q.intentCategory,
            difficulty: q.difficulty,
          })),
        });
      }
    }

    // Determine target questions
    const whereClause: any = { organizationId };
    if (options?.difficulty) {
      whereClause.difficulty = options.difficulty;
    }

    let limit = options?.limit;
    if (options?.preset === "quick") limit = 5;
    else if (options?.preset === "standard") limit = 15;

    const questions = await db.evalQuestion.findMany({
      where: whereClause,
      select: { id: true },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    const run = await db.evalRun.create({
      data: {
        organizationId,
        status: "RUNNING",
        totalQuestions: questions.length,
      },
    });

    return {
      runId: run.id,
      totalQuestions: questions.length,
      questionIds: questions.map((q) => q.id),
    };
  }

  /**
   * Evaluates a batch of questions for an active run (typically 3-5 at a time concurrently).
   * Saves results and aggregates running metrics.
   */
  static async evaluateQuestionsBatch(
    evalRunId: string,
    organizationId: string,
    questionIds?: string[],
    batchSize = 4
  ): Promise<{
    batchResults: QuestionResult[];
    completedCount: number;
    totalQuestions: number;
    isCompleted: boolean;
    runningMetrics: EvalMetrics;
  }> {
    const run = await db.evalRun.findUnique({ where: { id: evalRunId } });
    if (!run) throw new Error("Evaluation run not found");

    // Identify which questions need evaluation
    let targetQuestions: any[] = [];
    if (questionIds && questionIds.length > 0) {
      targetQuestions = await db.evalQuestion.findMany({
        where: { id: { in: questionIds } },
      });
    } else {
      // Find questions that haven't been evaluated yet for this run
      const evaluated = await db.evalResult.findMany({
        where: { evalRunId },
        select: { evalQuestionId: true },
      });
      const evaluatedIds = evaluated.map((e) => e.evalQuestionId);

      targetQuestions = await db.evalQuestion.findMany({
        where: {
          organizationId: run.organizationId,
          id: { notIn: evaluatedIds },
        },
        orderBy: { createdAt: "asc" },
        take: batchSize,
      });
    }

    // Evaluate batch questions sequentially to prevent DB connection spikes
    const batchResults: QuestionResult[] = [];
    for (const q of targetQuestions) {
      const res = await BatchEvaluationService.evaluateQuestion(q, run.organizationId);
      batchResults.push(res);
    }

    // Save individual results with retry logic for transient connection pooling limits
    for (const result of batchResults) {
      let saved = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await db.evalResult.create({
            data: {
              evalRunId,
              evalQuestionId: result.questionId,
              retrievedDocumentCategories: result.retrievedCategories,
              recall5Hit: result.recall5Hit,
              reciprocalRank: result.reciprocalRank,
              dcg5: result.dcg5,
              precision5: result.precision5,
              faithfulnessScore: result.faithfulnessScore,
              hallucinationScore: result.hallucinationScore,
              latencyMs: result.latencyMs,
            },
          });
          saved = true;
          break;
        } catch (err: any) {
          if (attempt === 3) throw err;
          await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
        }
      }
    }

    // Tally accumulated results for this run
    const allResults = await db.evalResult.findMany({
      where: { evalRunId },
    });

    const n = allResults.length;
    const totalQ = run.totalQuestions || n;
    const isCompleted = n >= totalQ || targetQuestions.length === 0;

    const recall5 = n > 0 ? allResults.filter((r) => r.recall5Hit).length / n : 0;
    const mrr = n > 0 ? allResults.reduce((s, r) => s + r.reciprocalRank, 0) / n : 0;
    const ndcg5 = n > 0 ? allResults.reduce((s, r) => s + r.dcg5, 0) / n : 0;
    const precision5 = n > 0 ? allResults.reduce((s, r) => s + r.precision5, 0) / n : 0;
    const avgLatencyMs = n > 0 ? allResults.reduce((s, r) => s + r.latencyMs, 0) / n : 0;

    const faithResults = allResults.filter((r) => r.faithfulnessScore !== null);
    const avgFaithfulness =
      faithResults.length > 0
        ? faithResults.reduce((s, r) => s + (r.faithfulnessScore ?? 0), 0) / faithResults.length
        : null;
    const avgHallucination =
      faithResults.length > 0
        ? faithResults.reduce((s, r) => s + (r.hallucinationScore ?? 0), 0) / faithResults.length
        : null;

    if (isCompleted) {
      await db.evalRun.update({
        where: { id: evalRunId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          totalQuestions: n,
          recall5,
          mrr,
          ndcg5,
          precision5,
          avgFaithfulness,
          avgHallucination,
          avgLatencyMs,
        },
      });
    }

    return {
      batchResults,
      completedCount: n,
      totalQuestions: totalQ,
      isCompleted,
      runningMetrics: {
        recall5,
        mrr,
        ndcg5,
        precision5,
        avgFaithfulness: avgFaithfulness ?? 0,
        avgHallucination: avgHallucination ?? 0,
        avgLatencyMs,
      },
    };
  }

  /**
   * Cancels a running evaluation run, aggregating whatever partial results exist.
   */
  static async cancelRun(evalRunId: string): Promise<void> {
    const allResults = await db.evalResult.findMany({ where: { evalRunId } });
    const n = allResults.length;

    if (n > 0) {
      const recall5 = allResults.filter((r) => r.recall5Hit).length / n;
      const mrr = allResults.reduce((s, r) => s + r.reciprocalRank, 0) / n;
      const ndcg5 = allResults.reduce((s, r) => s + r.dcg5, 0) / n;
      const precision5 = allResults.reduce((s, r) => s + r.precision5, 0) / n;
      const avgLatencyMs = allResults.reduce((s, r) => s + r.latencyMs, 0) / n;

      await db.evalRun.update({
        where: { id: evalRunId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          errorMessage: "Run stopped by user (partial results saved)",
          totalQuestions: n,
          recall5,
          mrr,
          ndcg5,
          precision5,
          avgLatencyMs,
        },
      });
    } else {
      await db.evalRun.update({
        where: { id: evalRunId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          errorMessage: "Run stopped by user",
        },
      });
    }
  }

  /**
   * Triggers a batch evaluation run asynchronously (CLI or server fallback).
   */
  static async triggerRun(organizationId: string): Promise<string> {
    const { runId } = await BatchEvaluationService.createRun(organizationId);

    // Run in background — non-blocking
    BatchEvaluationService.executeRun(runId, organizationId).catch((err) => {
      console.error(`[BatchEval] Run ${runId} failed:`, err);
      db.evalRun
        .update({
          where: { id: runId },
          data: { status: "FAILED", errorMessage: String(err), completedAt: new Date() },
        })
        .catch(() => {});
    });

    return runId;
  }

  /**
   * Executes the full batch evaluation against all EvalQuestions for the org.
   */
  static async executeRun(evalRunId: string, organizationId: string): Promise<EvalMetrics> {
    const questions = await db.evalQuestion.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    });

    if (questions.length === 0) {
      await db.evalRun.update({
        where: { id: evalRunId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          totalQuestions: 0,
          recall5: 0,
          mrr: 0,
          ndcg5: 0,
          precision5: 0,
          avgFaithfulness: null,
          avgHallucination: null,
          avgLatencyMs: 0,
        },
      });
      return { recall5: 0, mrr: 0, ndcg5: 0, precision5: 0, avgFaithfulness: 0, avgHallucination: 0, avgLatencyMs: 0 };
    }

    // Process in parallel batches of 4
    const BATCH_SIZE = 4;
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const slice = questions.slice(i, i + BATCH_SIZE);
      await BatchEvaluationService.evaluateQuestionsBatch(
        evalRunId,
        organizationId,
        slice.map((q) => q.id),
        slice.length
      );
    }

    const updated = await db.evalRun.findUnique({ where: { id: evalRunId } });
    return {
      recall5: updated?.recall5 ?? 0,
      mrr: updated?.mrr ?? 0,
      ndcg5: updated?.ndcg5 ?? 0,
      precision5: updated?.precision5 ?? 0,
      avgFaithfulness: updated?.avgFaithfulness ?? 0,
      avgHallucination: updated?.avgHallucination ?? 0,
      avgLatencyMs: updated?.avgLatencyMs ?? 0,
    };
  }

  /**
   * Evaluates a single question: runs retrieval, computes IR metrics, optionally runs LLM judge.
   */
  private static async evaluateQuestion(
    q: { id: string; question: string; expectedAnswer: string; relevantCategories: string[]; organizationId: string },
    organizationId: string
  ): Promise<QuestionResult> {
    const start = Date.now();

    let chunks: any[] = [];
    let retrievalLogId: string | null = null;

    try {
      const result = await RetrievalService.buildContextualPrompt(q.question, organizationId, []);
      chunks = result.chunks || [];
      retrievalLogId = result.debugInfo?.retrievalLogId ?? null;
    } catch (err) {
      console.warn(`[BatchEval] Retrieval failed for question "${q.question.slice(0, 60)}":`, err);
    }

    const latencyMs = Date.now() - start;

    // Map retrieved chunks to document categories
    const K = 5;
    const topChunks = chunks.slice(0, K);
    const retrievedCategories = topChunks.map((c: any) => {
      const vis = (c.metadata?.visibility || c.visibility || "").toLowerCase();
      const docName = (c.documentName || "").toLowerCase();
      if (docName.includes("policy") || docName.includes("regulation") || docName.includes("handbook")) return "policy";
      if (docName.includes("syllab") || docName.includes("course") || docName.includes("academic")) return "academic";
      if (docName.includes("financial") || docName.includes("fee") || docName.includes("tuition")) return "financial";
      if (docName.includes("faculty") || docName.includes("staff") || docName.includes("professor")) return "faculty";
      return "general";
    });

    // Relevance: a chunk is relevant if its category matches any expected category
    const expectedSet = new Set(q.relevantCategories.map((c) => c.toLowerCase()));
    const relevanceMask = retrievedCategories.map((cat) => expectedSet.has(cat) || expectedSet.has("general"));

    // Recall@5: at least one relevant result in top-5
    const recall5Hit = relevanceMask.some(Boolean);

    // MRR: 1/rank of first relevant result (rank is 1-indexed)
    const firstRelevantIdx = relevanceMask.findIndex(Boolean);
    const reciprocalRank = firstRelevantIdx >= 0 ? 1 / (firstRelevantIdx + 1) : 0;

    // NDCG@5
    const dcg5 = computeNDCG(relevanceMask, K);

    // Precision@5
    const precision5 = relevanceMask.filter(Boolean).length / Math.max(topChunks.length, 1);

    // Optional LLM judge (async, non-blocking for performance — only if we have a retrievalLogId)
    let faithfulnessScore: number | null = null;
    let hallucinationScore: number | null = null;

    if (retrievalLogId && chunks.length > 0) {
      try {
        const contextText = topChunks.map((c: any) => c.chunkText || "").join("\n\n");
        const judgeResult = await BatchEvaluationService.runLlmJudge(
          q.question,
          contextText,
          q.expectedAnswer
        );
        faithfulnessScore = judgeResult.faithfulnessScore;
        hallucinationScore = judgeResult.hallucinationScore;
      } catch {
        // LLM judge is optional — swallow errors
      }
    }

    return {
      questionId: q.id,
      question: q.question,
      retrievedCategories,
      recall5Hit,
      reciprocalRank,
      dcg5,
      precision5,
      faithfulnessScore,
      hallucinationScore,
      latencyMs,
    };
  }

  /**
   * Lightweight LLM-as-judge for faithfulness scoring.
   */
  private static async runLlmJudge(
    query: string,
    context: string,
    expectedAnswer: string
  ): Promise<{ faithfulnessScore: number; hallucinationScore: number }> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return { faithfulnessScore: 0.5, hallucinationScore: 0.5 };

    const prompt = `You are a RAG evaluation judge. Given a user query, retrieved context, and expected answer, score faithfulness (0.0–1.0) — how well the expected answer is grounded in the context.

Return ONLY: {"faithfulness": 0.0}

QUERY: ${query.slice(0, 300)}
CONTEXT: ${context.slice(0, 800)}
EXPECTED ANSWER: ${expectedAnswer.slice(0, 300)}`;

    const res = await fetch(`${ModelConfig.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ModelConfig.evaluation,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.0,
        max_tokens: 50,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`LLM judge HTTP ${res.status}`);
    const body = await res.json();
    const content = body?.choices?.[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(content.replace(/```json|```/g, "").trim());
    const f = typeof parsed.faithfulness === "number" ? Math.max(0, Math.min(1, parsed.faithfulness)) : 0.5;
    return { faithfulnessScore: f, hallucinationScore: Number((1 - f).toFixed(4)) };
  }

  /**
   * Returns a list of all eval runs for an org, most recent first, with auto-healing for stale runs.
   */
  static async listRuns(organizationId: string) {
    // Auto-heal stale runs (> 3 minutes with status RUNNING)
    const staleCutoff = new Date(Date.now() - 3 * 60 * 1000);
    const staleRuns = await db.evalRun.findMany({
      where: {
        organizationId,
        status: "RUNNING",
        startedAt: { lt: staleCutoff },
      },
      include: {
        evalResults: true,
      },
    });

    for (const stale of staleRuns) {
      const n = stale.evalResults.length;
      if (n > 0) {
        const recall5 = stale.evalResults.filter((r) => r.recall5Hit).length / n;
        const mrr = stale.evalResults.reduce((s, r) => s + r.reciprocalRank, 0) / n;
        const ndcg5 = stale.evalResults.reduce((s, r) => s + r.dcg5, 0) / n;
        const precision5 = stale.evalResults.reduce((s, r) => s + r.precision5, 0) / n;
        const avgLatencyMs = stale.evalResults.reduce((s, r) => s + r.latencyMs, 0) / n;

        await db.evalRun.update({
          where: { id: stale.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            totalQuestions: n,
            recall5,
            mrr,
            ndcg5,
            precision5,
            avgLatencyMs,
          },
        });
      } else {
        await db.evalRun.update({
          where: { id: stale.id },
          data: {
            status: "FAILED",
            completedAt: new Date(),
            errorMessage: "Timed out before questions could be evaluated",
          },
        });
      }
    }

    const runs = await db.evalRun.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { evalResults: true },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 20,
    });

    return runs.map((run) => ({
      ...run,
      completedQuestions: run._count.evalResults,
    }));
  }

  /**
   * Cleans any running runs for an org immediately.
   */
  static async cleanStaleRuns(organizationId: string) {
    const running = await db.evalRun.findMany({
      where: { organizationId, status: "RUNNING" },
      include: { evalResults: true },
    });

    for (const run of running) {
      await BatchEvaluationService.cancelRun(run.id);
    }
  }

  /**
   * Returns the full per-question breakdown for a specific run.
   */
  static async getRunDetails(evalRunId: string) {
    return db.evalResult.findMany({
      where: { evalRunId },
      include: { evalQuestion: true },
      orderBy: { createdAt: "asc" },
    });
  }
}
