import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { OpenAIEmbeddings } from "@langchain/openai";
import { ModelConfig } from "./model-config";

const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";
if (!process.env.OPENAI_API_KEY && apiKey) {
  process.env.OPENAI_API_KEY = apiKey;
}

export const embeddings = new OpenAIEmbeddings({
  model: ModelConfig.embedding,
  openAIApiKey: apiKey,
  apiKey: apiKey,
  configuration: {
    baseURL: ModelConfig.baseUrl,
    apiKey: apiKey,
    defaultHeaders: {
      Authorization: `Bearer ${apiKey}`,
    },
  },
});
