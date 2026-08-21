import { appGraph } from "@/ai/graph/workflow";

async function testChatResponse() {
  console.log("=== TESTING CHAT RESPONSE ASSEMBLY ===");

  const state = await appGraph.invoke({
    messages: [
      {
        role: "user",
        content: "give me the CNIP ppt in that extract 1-4 pages",
      } as any,
    ],
    organizationId: "90e26a10-1946-4191-b004-035470615d48",
    userId: "9b5a2998-1e9b-4cdc-9afa-febaff98cec7",
    userRole: "OWNER" as any,
  });

  console.log("\n--- FINAL PROMPT SENT TO LLM ---");
  console.log(state.finalPrompt);
}

testChatResponse()
  .catch((e) => console.error("Error:", e))
  .finally(() => process.exit(0));
