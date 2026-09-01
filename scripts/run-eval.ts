/**
 * CLI evaluation runner.
 * Usage:  npx tsx scripts/run-eval.ts
 *
 * 1. Seeds the dataset if no questions exist yet.
 * 2. Executes a full batch evaluation run.
 * 3. Prints a formatted summary table to stdout.
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

// We import the service directly — it relies on @/... aliases which tsx resolves
// via tsconfig paths. If aliases fail, adjust the relative import below.
import { BatchEvaluationService } from "../src/server/services/batch-evaluation.service";

const db = new PrismaClient();
const ORGANIZATION_ID = process.env.SEED_ORG_ID || "seed-org-001";

function bar(value: number | null, width = 20): string {
  if (value === null) return "—".padEnd(width);
  const filled = Math.round((value ?? 0) * width);
  const pct = Math.round((value ?? 0) * 100);
  return `[${"█".repeat(filled)}${"░".repeat(width - filled)}] ${pct}%`;
}

function color(value: number | null): string {
  if (value === null) return "\x1b[90m"; // grey
  if (value >= 0.8) return "\x1b[32m";  // green
  if (value >= 0.6) return "\x1b[33m";  // yellow
  return "\x1b[31m";                    // red
}

const RESET = "\x1b[0m";

async function main() {
  console.log("\n\x1b[1m=== NexusIQ RAG Evaluation Runner ===\x1b[0m\n");

  // Check question count
  const count = await db.evalQuestion.count({ where: { organizationId: ORGANIZATION_ID } });
  if (count === 0) {
    console.log(
      "\x1b[33m⚠ No evaluation questions found.\x1b[0m\n" +
        "Run: npx tsx scripts/seed-eval-dataset.ts\n"
    );
    await db.$disconnect();
    process.exit(1);
  }

  console.log(`📋 Found ${count} evaluation questions for org: ${ORGANIZATION_ID}`);
  console.log("🚀 Starting evaluation run...\n");

  const startMs = Date.now();

  // Create a run record directly (CLI bypasses the API)
  const run = await db.evalRun.create({
    data: { organizationId: ORGANIZATION_ID, status: "RUNNING" },
  });

  let metrics;
  try {
    metrics = await BatchEvaluationService.executeRun(run.id, ORGANIZATION_ID);
  } catch (err) {
    console.error("\x1b[31m✗ Evaluation run failed:\x1b[0m", err);
    await db.$disconnect();
    process.exit(1);
  }

  const elapsedSec = ((Date.now() - startMs) / 1000).toFixed(1);

  // ── Summary table ────────────────────────────────────────────────────────
  console.log("\n\x1b[1m─── Retrieval Metrics ───────────────────────────────\x1b[0m");
  for (const [label, val] of [
    ["Recall@5     ", metrics.recall5],
    ["MRR          ", metrics.mrr],
    ["NDCG@5       ", metrics.ndcg5],
    ["Precision@5  ", metrics.precision5],
  ] as [string, number][]) {
    console.log(`  ${label}  ${color(val)}${bar(val)}${RESET}`);
  }

  console.log("\n\x1b[1m─── Answer Quality ──────────────────────────────────\x1b[0m");
  if (metrics.avgFaithfulness > 0) {
    console.log(`  Faithfulness   ${color(metrics.avgFaithfulness)}${bar(metrics.avgFaithfulness)}${RESET}`);
    const grounded = 1 - metrics.avgHallucination;
    console.log(`  Grounded       ${color(grounded)}${bar(grounded)}${RESET}`);
  } else {
    console.log("  (LLM judge not run — no API key or no chunks retrieved)");
  }

  console.log("\n\x1b[1m─── Performance ─────────────────────────────────────\x1b[0m");
  console.log(`  Avg Latency    ${Math.round(metrics.avgLatencyMs)}ms per question`);
  console.log(`  Total Runtime  ${elapsedSec}s for ${count} questions`);
  console.log(`\n  Run ID: ${run.id}\n`);

  // ── Per-question failures ─────────────────────────────────────────────────
  const results = await BatchEvaluationService.getRunDetails(run.id);
  const failures = results.filter((r) => !r.recall5Hit);
  if (failures.length > 0) {
    console.log(`\x1b[33m⚠ ${failures.length} question(s) with Recall@5=0:\x1b[0m`);
    failures.slice(0, 10).forEach((r) => {
      console.log(`  • ${r.evalQuestion.question.slice(0, 80)}…`);
    });
    if (failures.length > 10) console.log(`  … and ${failures.length - 10} more`);
    console.log();
  } else {
    console.log("\x1b[32m✓ All questions retrieved at least one relevant result in top-5\x1b[0m\n");
  }

  await db.$disconnect();
}

main().catch((err) => {
  console.error("\x1b[31m[run-eval] Fatal error:\x1b[0m", err);
  process.exit(1);
});
