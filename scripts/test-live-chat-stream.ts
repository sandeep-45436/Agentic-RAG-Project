import * as path from "path";
import * as dotenv from "dotenv";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { db } from "../src/server/db/prisma";
import { appGraph } from "../src/ai/graph/workflow";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { ModelConfig } from "../src/ai/llm/model-config";

async function main() {
  console.log("===================================================================");
  console.log("💬 TESTING FULL END-TO-END CHAT STREAM GENERATION WITH RAG");
  console.log("===================================================================\n");

  const org = await db.organization.findFirst();
  const user = await db.user.findFirst();

  const questions = [
    "What are the prerequisites, credits, and syllabus topics for CS401?",
    "Extract page 1 from CS401 syllabus and give me the download link",
    "What is the minimum attendance required and condonation policy according to academic regulations?",
  ];

  const openrouter = createOpenAI({
    baseURL: ModelConfig.baseUrl,
    apiKey: process.env.OPENROUTER_API_KEY || "",
  });

  for (const q of questions) {
    console.log(`\n=======================================================`);
    console.log(`❓ USER QUESTION: "${q}"`);
    console.log(`=======================================================`);

    const finalState = await appGraph.invoke({
      messages: [{ role: "user", content: q } as any],
      organizationId: org!.id,
      userId: user!.id,
      userRole: "OWNER" as any,
    });

    console.log(`👉 Routed Path: ${finalState.routedPath}`);
    if (finalState.documentDelivery) {
      console.log(`👉 Document Delivery: ${finalState.documentDelivery.documentName}`);
      console.log(`👉 Signed URL: ${finalState.documentDelivery.downloadUrl}`);
    }

    const { text } = await generateText({
      model: openrouter.chat(ModelConfig.reasoning),
      prompt: finalState.finalPrompt,
      temperature: 0.2,
    });

    console.log(`\n🤖 ASSISTANT RESPONSE:\n`);
    console.log(text);
    console.log(`\n-------------------------------------------------------`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
