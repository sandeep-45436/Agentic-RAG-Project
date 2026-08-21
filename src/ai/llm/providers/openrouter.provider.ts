import { LLMProvider, LLMRequest, LLMResponse, LLMChunk } from "../provider";
import { ModelConfig } from "../model-config";

/**
 * OpenRouter LLM Provider
 *
 * Routes to any model available on OpenRouter (OpenAI, Meta Llama,
 * Anthropic, Google) through a single unified endpoint.
 */
export class OpenRouterProvider implements LLMProvider {
  readonly name = "openrouter";
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";
    this.baseUrl = ModelConfig.baseUrl;
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const start = performance.now();

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.3,
        max_tokens: request.maxTokens,
        ...(request.responseFormat && { response_format: request.responseFormat }),
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "unknown");
      throw new Error(
        `[OpenRouterProvider] ${request.model} returned ${res.status}: ${errorBody}`
      );
    }

    const body = await res.json();
    const latencyMs = Math.round(performance.now() - start);

    const choice = body?.choices?.[0];
    const usage = body?.usage;

    console.log(
      JSON.stringify({
        event: "LLM_GATEWAY_CALL",
        provider: this.name,
        model: request.model,
        latencyMs,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        timestamp: new Date().toISOString(),
      })
    );

    return {
      content: choice?.message?.content?.trim() || "",
      model: body?.model || request.model,
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens || 0,
            completionTokens: usage.completion_tokens || 0,
            totalTokens: usage.total_tokens || 0,
          }
        : undefined,
      latencyMs,
    };
  }

  async *stream(request: LLMRequest): AsyncIterable<LLMChunk> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.3,
        max_tokens: request.maxTokens,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`[OpenRouterProvider] Stream failed with status ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            yield { content: "", done: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content || "";
            yield { content: delta, done: false };
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
