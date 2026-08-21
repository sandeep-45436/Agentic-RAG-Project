import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ModelConfig } from "./model-config";

// Enforce types for fallback models including Meta models
const FALLBACK_MODELS = ModelConfig.failoverChain;

export class FailoverLLM {
  /**
   * Invokes the LLM with failover, retries, and timeout controls.
   */
  static async invoke(
    messages: any[],
    options?: {
      temperature?: number;
      maxRetries?: number;
      timeoutMs?: number;
      primaryModel?: string;
    }
  ): Promise<any> {
    const primaryModel = options?.primaryModel || "openai/gpt-4o";
    const maxRetries = options?.maxRetries ?? 3;
    const timeoutMs = options?.timeoutMs ?? 15000; // 15s timeout
    const temperature = options?.temperature ?? 0.3;

    // List of models to try in sequence
    const modelsToTry = [primaryModel, ...FALLBACK_MODELS];
    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      let attempt = 0;
      while (attempt < maxRetries) {
        try {
          const client = new ChatOpenAI({
            model: model,
            temperature: temperature,
            apiKey: process.env.OPENROUTER_API_KEY,
            configuration: {
              baseURL: "https://openrouter.ai/api/v1",
            },
          });

          // Race the LLM invoke call against a timeout promise
          const result = await Promise.race([
            client.invoke(messages),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Model ${model} execution timed out after ${timeoutMs}ms`)), timeoutMs)
            ),
          ]);

          return result;
        } catch (error: any) {
          attempt++;
          lastError = error;
          console.warn(
            `[FailoverLLM] Attempt ${attempt}/${maxRetries} failed for model: ${model}. Error: ${error.message}`
          );

          if (attempt < maxRetries) {
            // Jittered exponential backoff: 1.5s, 3.0s, 6.0s
            const delay = Math.pow(2, attempt) * 750 + Math.random() * 500;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
      
      console.warn(`[FailoverLLM] Failover triggered: ${model} failed, switching to next fallback...`);
    }

    throw new Error(`[FailoverLLM] All models failed. Last error: ${lastError?.message}`);
  }
}

export class FailoverEmbeddings {
  /**
   * Generates embeddings for document arrays with failover and retries.
   */
  static async embedDocuments(
    texts: string[],
    options?: { maxRetries?: number; timeoutMs?: number }
  ): Promise<number[][]> {
    const maxRetries = options?.maxRetries ?? 3;
    const timeoutMs = options?.timeoutMs ?? 20000; // 20s timeout
    const modelsToTry = ModelConfig.embeddingFailoverChain;
    
    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      let attempt = 0;
      while (attempt < maxRetries) {
        try {
          const client = new OpenAIEmbeddings({
            model: model,
            apiKey: process.env.OPENROUTER_API_KEY,
            configuration: {
              baseURL: "https://openrouter.ai/api/v1",
            },
          });

          const result = await Promise.race([
            client.embedDocuments(texts),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Embedding generation for model ${model} timed out`)), timeoutMs)
            ),
          ]);

          return result;
        } catch (error: any) {
          attempt++;
          lastError = error;
          console.warn(
            `[FailoverEmbeddings] Attempt ${attempt}/${maxRetries} failed for model ${model}: ${error.message}`
          );

          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    }

    throw new Error(`[FailoverEmbeddings] Embedding generation failed for all models: ${lastError?.message}`);
  }
}
