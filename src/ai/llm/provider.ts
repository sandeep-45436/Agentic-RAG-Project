/**
 * LLM Provider Interface — genuine provider independence.
 * Each provider implements this interface behind the LLM Gateway.
 *
 * Swapping OpenRouter → Direct OpenAI → Direct Meta requires
 * zero application code changes.
 */

export interface LLMRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: string };
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

export interface LLMChunk {
  content: string;
  done: boolean;
}

export interface LLMProvider {
  readonly name: string;
  generate(request: LLMRequest): Promise<LLMResponse>;
  stream(request: LLMRequest): AsyncIterable<LLMChunk>;
}
