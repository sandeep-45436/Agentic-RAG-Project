import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Check BM25 search_vector coverage
  const stats = await db.$queryRaw<Array<{ total: bigint; with_vector: bigint; missing: bigint }>>`
    SELECT
      COUNT(*) AS total,
      COUNT(search_vector) AS with_vector,
      COUNT(*) - COUNT(search_vector) AS missing
    FROM "Chunk"
    WHERE "deletedAt" IS NULL
  `;

  const { total, with_vector, missing } = stats[0];
  console.log(`\n=== BM25 search_vector Coverage ===`);
  console.log(`  Total active chunks  : ${total}`);
  console.log(`  With search_vector   : ${with_vector}`);
  console.log(`  Missing (not indexed): ${missing}`);

  if (Number(missing) === 0 && Number(total) > 0) {
    console.log(`\n  [OK] All chunks have BM25 tsvectors. Hybrid retrieval is ACTIVE.`);
  } else if (Number(total) === 0) {
    console.log(`\n  [INFO] No chunks in DB yet. Upload documents first.`);
  } else {
    console.log(`\n  [WARN] ${missing} chunks are missing search_vector. Trigger may not have run yet.`);
  }

  // Test a simple BM25 query to ensure search works end-to-end
  const testResult = await db.$queryRaw<Array<{ id: string; rank: number }>>`
    SELECT c."id", ts_rank_cd(c.search_vector, query) AS rank
    FROM "Chunk" c, websearch_to_tsquery('english', 'policy') AS query
    WHERE c.search_vector @@ query
      AND c."deletedAt" IS NULL
    ORDER BY rank DESC
    LIMIT 3
  `;

  console.log(`\n=== BM25 Live Query Test (query: 'policy') ===`);
  if (testResult.length > 0) {
    testResult.forEach((r, i) => console.log(`  Result ${i + 1}: chunk=${r.id.slice(0, 8)}... rank=${Number(r.rank).toFixed(4)}`));
    console.log(`  [OK] BM25 full-text search is returning results!`);
  } else {
    console.log(`  [INFO] No BM25 results for 'policy' — either no matching content or no chunks yet.`);
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
