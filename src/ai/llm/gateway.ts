import { LLMProvider, LLMRequest, LLMResponse, LLMChunk } from "./provider";
import { OpenRouterProvider } from "./providers/openrouter.provider";
import { ModelConfig } from "./model-config";

/**
 * LLM Gateway — provider-agnostic entry point.
 *
 * The application calls the gateway, not individual providers.
 * Swapping providers (OpenRouter → direct OpenAI/Meta/Gemini) requires
 * only adding a new provider class and updating the routing map.
 *
 * Architecture:
 *   Application → LLM Gateway → Provider → Model
 */
export class LLMGateway {
  private static instance: LLMGateway | null = null;
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider: LLMProvider;

  private constructor() {
    // Register available providers
    const openrouter = new OpenRouterProvider();
    this.providers.set("openrouter", openrouter);

    // Default: all models route through OpenRouter
    this.defaultProvider = openrouter;
  }

  static getInstance(): LLMGateway {
    if (!LLMGateway.instance) {
      LLMGateway.instance = new LLMGateway();
    }
    return LLMGateway.instance;
  }

  /**
   * Register a custom provider (e.g., direct Meta API, direct OpenAI).
   * Once registered, models matching the prefix will route to this provider.
   */
  registerProvider(name: string, provider: LLMProvider): void {
    this.providers.set(name, provider);
  }

  /**
   * Resolve which provider handles a given model ID.
   * Currently all models route through OpenRouter.
   * Future: route by prefix (e.g., meta-llama/* → MetaProvider).
   */
  private resolveProvider(_model: string): LLMProvider {
    // Future extension point:
    // if (model.startsWith("meta-llama/") && this.providers.has("meta")) return this.providers.get("meta")!;
    // if (model.startsWith("openai/") && this.providers.has("openai")) return this.providers.get("openai")!;
    return this.defaultProvider;
  }

  /**
   * Generate a completion using the appropriate provider.
   */
  async generate(request: LLMRequest): Promise<LLMResponse> {
    const provider = this.resolveProvider(request.model);
    return provider.generate(request);
  }

  /**
   * Stream a completion using the appropriate provider.
   */
  async *stream(request: LLMRequest): AsyncIterable<LLMChunk> {
    const provider = this.resolveProvider(request.model);
    yield* provider.stream(request);
  }

  /**
   * Convenience: generate with the configured reasoning model.
   */
  async reasoning(
    messages: LLMRequest["messages"],
    options?: Partial<Omit<LLMRequest, "messages" | "model">>
  ): Promise<LLMResponse> {
    return this.generate({ model: ModelConfig.reasoning, messages, ...options });
  }

  /**
   * Convenience: generate with the configured lightweight model.
   */
  async lightweight(
    messages: LLMRequest["messages"],
    options?: Partial<Omit<LLMRequest, "messages" | "model">>
  ): Promise<LLMResponse> {
    return this.generate({ model: ModelConfig.lightweight, messages, ...options });
  }

  /**
   * Convenience: generate with the configured evaluation model.
   */
  async evaluate(
    messages: LLMRequest["messages"],
    options?: Partial<Omit<LLMRequest, "messages" | "model">>
  ): Promise<LLMResponse> {
    return this.generate({ model: ModelConfig.evaluation, messages, ...options });
  }
}

/** Singleton gateway instance */
export const llmGateway = LLMGateway.getInstance();
