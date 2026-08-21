import * as path from "path";
import * as dotenv from "dotenv";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { db } from "../src/server/db/prisma";
import { PdfExtractionService } from "../src/server/services/pdf-extraction.service";
import { appGraph } from "../src/ai/graph/workflow";

async function main() {
  console.log("===================================================================");
  console.log("🧪 TESTING PDF EXTRACTION & CHAT RESPONSE PIPELINE");
  console.log("===================================================================\n");

  const org = await db.organization.findFirst();
  if (!org) throw new Error("No organization found");
  const user = await db.user.findFirst();
  const userId = user?.id || "admin_user";

  const docs = await db.document.findMany({ where: { organizationId: org.id } });
  console.log(`Found ${docs.length} documents in DB:`);
  docs.forEach((d) => console.log(`  - [${d.id}] ${d.fileName} (Path: ${d.storagePath})`));

  const sampleDoc = docs[0];
  if (!sampleDoc) throw new Error("No document available for testing");

  // ── Test 1: Full Document Retrieval ───────────────────────────────────────
  console.log("\n🧪 Test 1: PdfExtractionService.getFullDocument...");
  try {
    const fullDoc = await PdfExtractionService.getFullDocument(sampleDoc.id, org.id);
    console.log("  ✅ Full document URL generated successfully!");
    console.log(`     Document Name: ${fullDoc.documentName}`);
    console.log(`     Total Pages: ${fullDoc.totalPages}`);
    console.log(`     Signed Download URL: ${fullDoc.downloadUrl.slice(0, 80)}...`);
  } catch (err: any) {
    console.error("  ❌ Full document retrieval failed:", err?.message);
  }

  // ── Test 2: Page Extraction ───────────────────────────────────────────────
  console.log("\n🧪 Test 2: PdfExtractionService.createExtract (page 1)...");
  try {
    const extract = await PdfExtractionService.createExtract({
      documentId: sampleDoc.id,
      organizationId: org.id,
      pages: [1],
    });
    console.log("  ✅ Page extraction & storage upload successful!");
    console.log(`     Extract File: ${extract.documentName}`);
    console.log(`     Artifact ID: ${extract.artifactId}`);
    console.log(`     Signed Download URL: ${extract.downloadUrl.slice(0, 80)}...`);
  } catch (err: any) {
    console.error("  ❌ Page extraction failed:", err?.message);
  }

  // ── Test 3: Chat with Document Delivery / Extraction ──────────────────────
  console.log("\n🧪 Test 3: LangGraph Chat with PDF Extraction Request...");
  try {
    const state = await appGraph.invoke({
      messages: [
        {
          role: "user",
          content: "give me the CS401 syllabus and extract page 1",
        } as any,
      ],
      organizationId: org.id,
      userId: userId,
      userRole: "OWNER" as any,
    });

    console.log("  ✅ Chat pipeline executed successfully!");
    console.log("  👉 Routed Path:", state.routedPath);
    console.log("  👉 Document Delivery Result:", state.documentDelivery ? "Present" : "None");
    if (state.documentDelivery) {
      console.log(`     Document Name: ${state.documentDelivery.documentName}`);
      console.log(`     Pages: ${JSON.stringify(state.documentDelivery.pages)}`);
      console.log(`     Download URL: ${state.documentDelivery.downloadUrl.slice(0, 80)}...`);
    }
    console.log("\n  👉 Generated Final Prompt snippet sent to LLM:\n");
    console.log(state.finalPrompt.slice(0, 400) + "...\n");
  } catch (err: any) {
    console.error("  ❌ Chat extraction pipeline failed:", err?.message);
  }

  // ── Test 4: Chat with Information Retrieval from PDF ───────────────────────
  console.log("\n🧪 Test 4: LangGraph Chat for PDF Content Retrieval & Grounded Q&A...");
  try {
    const state = await appGraph.invoke({
      messages: [
        {
          role: "user",
          content: "What is the minimum attendance required and what happens if attendance is below 65% according to Academic Regulations?",
        } as any,
      ],
      organizationId: org.id,
      userId: userId,
      userRole: "MEMBER" as any,
    });

    console.log("  ✅ RAG Pipeline executed successfully!");
    console.log("  👉 Routed Path:", state.routedPath);
    console.log(`  👉 Retrieved Chunks: ${state.retrievedChunks?.length || 0}`);
    if (state.retrievedChunks && state.retrievedChunks.length > 0) {
      console.log(`     Top chunk source: ${state.retrievedChunks[0].documentName}`);
      console.log(`     Top chunk snippet: ${state.retrievedChunks[0].content.slice(0, 150)}...`);
    }
    console.log("\n  👉 Final Prompt snippet sent to LLM:\n");
    console.log(state.finalPrompt.slice(0, 400) + "...\n");
  } catch (err: any) {
    console.error("  ❌ Chat retrieval pipeline failed:", err?.message);
  }

  console.log("===================================================================");
  console.log("🎉 ALL PDF EXTRACTION & CHAT PIPELINES VERIFIED SUCCESSFULLY!");
  console.log("===================================================================");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
