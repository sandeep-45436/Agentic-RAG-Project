import { OpenAIEmbeddings } from "@langchain/openai";

// OpenRouter supports embeddings via the /embeddings endpoint.
// The model must be prefixed with "openai/" when using OpenRouter.
export const embeddings = new OpenAIEmbeddings({
  model: "openai/text-embedding-3-small",
  apiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
});
