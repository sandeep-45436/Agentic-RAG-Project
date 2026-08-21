import { IntentClassifier } from "@/ai/agents/intent-classifier";
import { DocumentDeliveryTool } from "@/ai/tools/document-delivery.tool";

async function testDirect() {
  const query = "give me the CNIP ppt in that extract 1-4 pages";
  console.log("=== TESTING QUERY ===");
  console.log("Query:", query);

  const intent = IntentClassifier.classify(query);
  console.log("\n--- INTENT RESULT ---");
  console.log(JSON.stringify(intent, null, 2));

  console.log("\n--- EXECUTING TOOL ---");
  const toolResult = await DocumentDeliveryTool.execute({
    operation: "GET_PAGES",
    query: query,
    pages: [1, 2, 3, 4],
    organizationId: "90e26a10-1946-4191-b004-035470615d48",
    userId: "9b5a2998-1e9b-4cdc-9afa-febaff98cec7",
    userRole: "OWNER",
  });

  console.log("\n--- TOOL RESULT ---");
  console.log(JSON.stringify(toolResult, null, 2));
}

testDirect()
  .catch((e) => console.error("Error:", e))
  .finally(() => process.exit(0));
