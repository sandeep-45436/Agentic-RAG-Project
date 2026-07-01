import { ChatOpenAI } from "@langchain/openai";

export const llm = new ChatOpenAI({
  model: "openai/gpt-4o-mini",
  temperature: 0.3,
  apiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
});
