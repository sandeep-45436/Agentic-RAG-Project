import { db } from "@/server/db/prisma";

export class EvaluationService {
  /**
   * Asynchronously runs an LLM-as-a-judge evaluation of a RAG query execution
   * and persists the evaluation scores (Recall@K, Faithfulness, Hallucination) to the database.
   *
   * Runs in the background so it never blocks the primary chat response.
   */
  static async evaluateAsync(params: {
    query: string;
    context: string;
    response: string;
    retrievalLogId: string;
  }) {
    // Non-blocking trigger
    Promise.resolve().then(async () => {
      try {
        console.log(`[EvaluationService] Starting background evaluation for query log: ${params.retrievalLogId}`);

        // Compute scores
        const { recallScore, faithfulnessScore, hallucinationScore } = 
          await EvaluationService.runLlmJudge(params.query, params.context, params.response);

        // Store to DB
        await db.evaluation.create({
          data: {
            query: params.query,
            recallScore,
            faithfulnessScore,
            hallucinationScore,
            retrievalLogId: params.retrievalLogId,
          },
        });

        console.log(
          `[EvaluationService] Completed evaluation for log ${params.retrievalLogId}: ` +
            `Recall=${recallScore.toFixed(2)} | Faithfulness=${faithfulnessScore.toFixed(2)} | Hallucination=${hallucinationScore.toFixed(2)}`
        );
      } catch (err) {
        console.error("[EvaluationService] Background evaluation failed:", err);
      }
    });
  }

  /**
   * Runs LLM-as-a-judge prompts using the project's OpenRouter configuration.
   * Includes structural JSON fallback outputs in case of API parsing failures.
   */
  private static async runLlmJudge(
    query: string,
    context: string,
    response: string
  ): Promise<{ recallScore: number; faithfulnessScore: number; hallucinationScore: number }> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.warn("[EvaluationService] No OpenRouter API key found. Falling back to heuristic evaluations.");
      return EvaluationService.fallbackHeuristic(query, context, response);
    }

    try {
      const prompt = `
You are an expert RAG system evaluation judge.
Given a user query, the retrieved context text, and the generated assistant response, evaluate the system on these metrics:

1. Recall@K (Context Recall): Do the retrieved chunks contain the key facts needed to answer the query?
   Score 0.0 to 1.0 (1.0 = contains all necessary facts, 0.0 = contains no relevant information).

2. Faithfulness: Is the generated assistant response fully grounded in the retrieved context?
   Score 0.0 to 1.0 (1.0 = every statement in the response is strictly supported by the context, 0.0 = contains hallucinations or external knowledge).

Return your evaluation EXACTLY in the following JSON format:
{
  "recall": 0.95,
  "faithfulness": 0.85
}
Do not write any markdown code block fences, explanation, or notes. Return only the raw JSON.

USER QUERY:
${query}

RETIREVED CONTEXT:
${context}

GENERATED ASSISTANT RESPONSE:
${response}
`;

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 1000,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenRouter returned status code ${res.status}`);
      }

      const body = await res.json();
      const content = body?.choices?.[0]?.message?.content?.trim() || "";
      const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      const recallScore = typeof parsed.recall === "number" ? Math.max(0, Math.min(1, parsed.recall)) : 0.8;
      const faithfulnessScore = typeof parsed.faithfulness === "number" ? Math.max(0, Math.min(1, parsed.faithfulness)) : 0.8;
      const hallucinationScore = Number((1.0 - faithfulnessScore).toFixed(4));

      return { recallScore, faithfulnessScore, hallucinationScore };
    } catch (e) {
      console.error("[EvaluationService] LLM judge evaluation failed, using heuristics:", e);
      return EvaluationService.fallbackHeuristic(query, context, response);
    }
  }

  /**
   * Fallback heuristic scoring using basic token overlapping checks.
   */
  private static fallbackHeuristic(
    query: string,
    context: string,
    response: string
  ): { recallScore: number; faithfulnessScore: number; hallucinationScore: number } {
    if (!context || context.trim().length === 0) {
      return { recallScore: 0.0, faithfulnessScore: 0.0, hallucinationScore: 1.0 };
    }

    // Heuristic context recall based on query keyword presence in context
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    if (queryWords.length === 0) {
      return { recallScore: 1.0, faithfulnessScore: 1.0, hallucinationScore: 0.0 };
    }

    const contextLower = context.toLowerCase();
    const matches = queryWords.filter((w) => contextLower.includes(w)).length;
    const recallScore = Number((matches / queryWords.length).toFixed(4));

    // Heuristic faithfulness check: check how many key words of response exist in the context
    const responseWords = response.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    if (responseWords.length === 0) {
      return { recallScore, faithfulnessScore: 1.0, hallucinationScore: 0.0 };
    }

    const groundedMatches = responseWords.filter((w) => contextLower.includes(w)).length;
    const faithfulnessScore = Number((groundedMatches / responseWords.length).toFixed(4));
    const hallucinationScore = Number((1.0 - faithfulnessScore).toFixed(4));

    return { recallScore, faithfulnessScore, hallucinationScore };
  }
}
