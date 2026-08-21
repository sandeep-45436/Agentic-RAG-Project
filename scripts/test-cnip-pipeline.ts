import { appGraph } from "@/ai/graph/workflow";

async function testPipeline() {
  console.log("=== INVOKING APP GRAPH FOR CNIP PPT EXTRACT ===");

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

  console.log("\n--- RESULT ---");
  console.log("Routed Path:", state.routedPath);
  console.log("Query Analysis:", JSON.stringify(state.queryAnalysis, null, 2));
  console.log("Cognitive Plan:", JSON.stringify(state.plan, null, 2));
  console.log("Document Delivery Result:", JSON.stringify(state.documentDelivery, null, 2));
  console.log("\n--- FINAL PROMPT ---");
  console.log(state.finalPrompt);
}

testPipeline()
  .catch((e) => console.error("Pipeline test error:", e))
  .finally(() => process.exit(0));
