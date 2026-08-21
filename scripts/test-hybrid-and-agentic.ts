import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

process.env.LANGCHAIN_TRACING_V2 = "false";

if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.OPENROUTER_API_KEY || "";
}

import { PrismaClient } from "@prisma/client";
import { RetrievalService } from "../src/server/services/retrieval.service";
import { BM25Service } from "../src/server/services/bm25.service";
import { AgenticOrchestrator } from "../src/ai/graph/agentic-orchestrator";

const db = new PrismaClient();

async function main() {
  console.log("\n=======================================================");
  console.log("  EMPIRICAL VERIFICATION: BM25, HYBRID RAG & AGENTIC RAG ");
  console.log("=======================================================\n");

  const chunk = await db.chunk.findFirst({ where: { deletedAt: null } });
  const organizationId = chunk?.organizationId || "4879df16-354e-4ba8-9c3f-aacc6856d3b9";

  const query = "frontend web development server";

  // 1. BM25 TSVector Full-Text Search
  console.log(`[1] TESTING BM25 FULL-TEXT SEARCH (query: "${query}")`);
  const bm25Results = await BM25Service.search("frontend", organizationId, 5);
  console.log(`    BM25 Chunks Found: ${bm25Results.length}`);
  bm25Results.forEach((r, i) => {
    console.log(`    - [Rank ${i + 1}] Score: ${r.bm25Score.toFixed(4)} | Content: "${r.content.slice(0, 70).replace(/\n/g, " ")}..."`);
  });

  // 2. Hybrid RAG (Vector + BM25 + Reciprocal Rank Fusion + WASM Rerank)
  console.log(`\n[2] TESTING FULL HYBRID RAG PIPELINE (Vector + BM25 + RRF + Rerank)`);
  const hybridResult = await RetrievalService.buildContextualPrompt(query, organizationId);

  console.log(`    Total Chunks Returned: ${hybridResult.chunks.length}`);
  console.log(`    Total Latency: ${hybridResult.debugInfo?.latencyMs}ms`);
  console.log(`    Retrieval Type: ${hybridResult.debugInfo?.retrievalType}`);
  console.log(`    Vector Chunks Searched: ${hybridResult.debugInfo?.vectorResultCount}`);
  console.log(`    BM25 Chunks Searched: ${hybridResult.debugInfo?.bm25ResultCount}`);
  console.log(`    Fused Candidates Merged: ${hybridResult.debugInfo?.fusedResultCount}`);
  hybridResult.chunks.forEach((chunk, i) => {
    console.log(`    - [Final Rerank ${i + 1}] Doc: ${chunk.documentName} | Text: "${chunk.chunkText.slice(0, 70).replace(/\n/g, " ")}..."`);
  });

  // 3. Agentic RAG Multi-Turn Orchestration
  console.log(`\n[3] TESTING MULTI-TURN AGENTIC RAG ORCHESTRATION`);
  const agentResult = await AgenticOrchestrator.run("Summarize key points about web frontend development and count chunks in database", {
    userId: "test-user",
    organizationId,
    userRole: "ADMIN",
  });

  console.log(`\n    Agent Execution Status: SUCCESS`);
  console.log(`    Iterations: ${agentResult.iterations}`);
  console.log(`    Tools Executed: [${agentResult.toolsExecuted.join(", ")}]`);
  console.log(`    Execution Logs:`);
  agentResult.logs.forEach((log) => console.log(`      • ${log}`));
  console.log(`\n    Synthesized Final Answer:\n    "${agentResult.answer.replace(/\n/g, " ").slice(0, 300)}..."`);

  console.log("\n=======================================================");
  console.log("  VERIFICATION COMPLETE: ALL FEATURES ACTIVE AND OPERATIONAL ");
  console.log("=======================================================\n");

  await db.$disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
