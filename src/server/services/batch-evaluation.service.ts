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
   * Triggers a batch evaluation run asynchronously. Returns the evalRunId immediately.
   */
  static async triggerRun(organizationId: string): Promise<string> {
    const run = await db.evalRun.create({
      data: { organizationId, status: "RUNNING" },
    });

    // Run in background — non-blocking
    BatchEvaluationService.executeRun(run.id, organizationId).catch((err) => {
      console.error(`[BatchEval] Run ${run.id} failed:`, err);
      db.evalRun
        .update({
          where: { id: run.id },
          data: { status: "FAILED", errorMessage: String(err), completedAt: new Date() },
        })
        .catch(() => {});
    });

    return run.id;
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

    const results: QuestionResult[] = [];

    for (const q of questions) {
      const result = await BatchEvaluationService.evaluateQuestion(q, organizationId);
      results.push(result);

      // Persist per-question result
      await db.evalResult.create({
        data: {
          evalRunId,
          evalQuestionId: q.id,
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
    }

    // Aggregate metrics
    const n = results.length;
    const recall5 = results.filter((r) => r.recall5Hit).length / n;
    const mrr = results.reduce((s, r) => s + r.reciprocalRank, 0) / n;
    const ndcg5 = results.reduce((s, r) => s + r.dcg5, 0) / n;
    const precision5 = results.reduce((s, r) => s + r.precision5, 0) / n;
    const avgLatencyMs = results.reduce((s, r) => s + r.latencyMs, 0) / n;

    const faithResults = results.filter((r) => r.faithfulnessScore !== null);
    const avgFaithfulness =
      faithResults.length > 0
        ? faithResults.reduce((s, r) => s + (r.faithfulnessScore ?? 0), 0) / faithResults.length
        : null;
    const avgHallucination =
      faithResults.length > 0
        ? faithResults.reduce((s, r) => s + (r.hallucinationScore ?? 0), 0) / faithResults.length
        : null;

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

    console.log(
      `[BatchEval] Run ${evalRunId} complete — Recall@5=${recall5.toFixed(3)} MRR=${mrr.toFixed(3)} NDCG@5=${ndcg5.toFixed(3)} Precision@5=${precision5.toFixed(3)} LatencyMs=${avgLatencyMs.toFixed(0)}`
    );

    return { recall5, mrr, ndcg5, precision5, avgFaithfulness: avgFaithfulness ?? 0, avgHallucination: avgHallucination ?? 0, avgLatencyMs };
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
   * Returns a list of all eval runs for an org, most recent first.
   */
  static async listRuns(organizationId: string) {
    return db.evalRun.findMany({
      where: { organizationId },
      orderBy: { startedAt: "desc" },
      take: 20,
    });
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
