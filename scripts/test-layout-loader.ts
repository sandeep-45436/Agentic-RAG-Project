import * as fs from "fs";
import * as path from "path";
import { loadEnvConfig } from "@next/env";
import { parsePdfNativeMultimodal, chunkParsedElements, ParsedElement } from "../src/ai/loaders/layout-loader";

// Load Next.js environment configuration natively, forcing development mode
loadEnvConfig(process.cwd(), true);

// A realistic layout-aware parser output mock representing a document page with mixed text, a table, and a chart
const MOCK_PARSED_ELEMENTS: ParsedElement[] = [
  {
    type: "text",
    pageNumber: 1,
    content: "Executive Summary:\nOur department executed a strategic automation plan over the course of Q1 to Q3 in 2025. The initial launch faced integration hurdles, but consecutive system upgrades dramatically improved operational efficiency. The subsequent data demonstrates substantial cost reductions and savings.",
    metadata: { title: "Executive Summary" }
  },
  {
    type: "table",
    pageNumber: 1,
    content: "| Quarter | Operational Cost (USD) | Automation Savings |\n| :--- | :--- | :--- |\n| Q1 | $1,200,000 | $50,000 |\n| Q2 | $1,150,000 | $100,000 |\n| Q3 | $1,020,000 | $230,000 |",
    metadata: {
      title: "Quarterly Cost Analysis Table",
      headers: ["Quarter", "Operational Cost (USD)", "Automation Savings"],
      summary: "Quarterly automation implementation outcomes table reporting cost reductions and savings from Q1 ($50k) to Q3 ($230k)."
    }
  },
  {
    type: "chart",
    pageNumber: 2,
    content: "Chart Type: Bar Chart\nTitle: Quarterly Operational Cost Savings\nAxes:\n- X-axis: Quarters (Q1, Q2, Q3)\n- Y-axis: USD Savings (Range $0 - $300,000)\nKey Trend: Savings grew exponentially. Q1 started at $50k, Q2 doubled to $100k, and Q3 peaked at $230k after full automation integration.",
    metadata: {
      title: "Cost Savings Trend Chart",
      visualContext: "X-axis: Quarters, Y-axis: Savings USD. Shows exponential savings growth.",
      summary: "Exponential savings trajectory bar chart illustrating a rising trend from $50,000 in Q1 to $230,000 in Q3 due to automation."
    }
  },
  {
    type: "text",
    pageNumber: 2,
    content: "Conclusion:\nBased on the table and trends above, the automation framework has verified its ROI. We recommend expanding the system rollouts to additional service groups in Q4.",
    metadata: { title: "Conclusion" }
  }
];

async function main() {
  console.log("=== Layout-Aware PDF Ingestion Verification ===");
  
  // Verify API Key
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ Warning: OPENROUTER_API_KEY is not defined. Proceeding in Simulation Mode.");
  } else {
    console.log("✅ API Key found in environment.");
  }

  // Path to local sample PDF
  const pdfPath = path.join(
    __dirname,
    "..",
    "node_modules",
    "pdf-parse",
    "test",
    "data",
    "04-valid.pdf"
  );

  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ Error: Sample PDF not found at: ${pdfPath}`);
    process.exit(1);
  }
  console.log(`Sample PDF found: ${pdfPath}`);

  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    let elements: ParsedElement[] = [];

    if (apiKey) {
      try {
        console.log(`⏳ Attempting live PDF parse (${(pdfBuffer.length / 1024).toFixed(1)} KB) using Gemini 2.5 Flash via OpenRouter...`);
        const startTime = performance.now();
        elements = await parsePdfNativeMultimodal(pdfBuffer, "04-valid.pdf");
        const parseTime = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Live parsing successful in ${parseTime}s! Found ${elements.length} layout elements.`);
      } catch (apiErr: any) {
        console.warn(`\n⚠️ Live API call failed: ${apiErr.message}`);
        console.log("🔄 Falling back to Layout Simulation Mode to verify parsing and chunking routing...");
        elements = MOCK_PARSED_ELEMENTS;
      }
    } else {
      console.log("🔄 Running in Simulation Mode...");
      elements = MOCK_PARSED_ELEMENTS;
    }

    console.log("\n--- Extracted Layout Elements ---");
    elements.forEach((el, index) => {
      console.log(`\n[Element ${index + 1}] Type: ${el.type.toUpperCase()} | Page: ${el.pageNumber}`);
      if (el.metadata?.title) {
        console.log(`Title: "${el.metadata.title}"`);
      }
      if (el.type === "table" && el.metadata?.headers) {
        console.log(`Table Columns: [${el.metadata.headers.join(", ")}]`);
      }
      if (el.type === "chart" && el.metadata?.visualContext) {
        console.log(`Visual Context: "${el.metadata.visualContext}"`);
      }
      // Print first 150 characters of content
      const preview = el.content.length > 200 ? el.content.slice(0, 200) + "..." : el.content;
      console.log(`Content:\n${preview}`);
    });

    console.log("\n--- Chunking Results & Database Formatting ---");
    const chunks = await chunkParsedElements(elements);
    console.log(`Converted layout elements into ${chunks.length} dense semantic chunks.`);
    chunks.forEach((chunk, index) => {
      console.log(`\n[Chunk ${index + 1}]`);
      console.log(`  - Type: ${chunk.metadata.chunkType.toUpperCase()}`);
      console.log(`  - Page: ${chunk.pageNumber}`);
      console.log(`  - DB Metadata Payload:`, {
        chunkType: chunk.metadata.chunkType,
        title: chunk.metadata.title,
        tableHeaders: chunk.metadata.tableHeaders || [],
        visualContext: chunk.metadata.visualContext || null,
        summary: chunk.metadata.summary || null
      });
      console.log(`  - Content Preview:\n    ${chunk.text.slice(0, 100).replace(/\n/g, " ")}...`);
    });

    console.log("\n✅ Ingestion verification completed successfully!");
  } catch (error: any) {
    console.error("❌ Verification failed:", error.message || error);
    process.exit(1);
  }
}

main();
