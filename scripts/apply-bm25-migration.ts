import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Applying BM25 tsvector trigger and backfill...");

  // 1. Create or replace trigger function
  await db.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION chunk_search_vector_update()
    RETURNS trigger AS $$
    BEGIN
      NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
      RETURN NEW;
    END
    $$ LANGUAGE plpgsql;
  `);

  // 2. Drop and recreate trigger
  await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS chunk_search_vector_trigger ON "Chunk";`);
  await db.$executeRawUnsafe(`
    CREATE TRIGGER chunk_search_vector_trigger
      BEFORE INSERT OR UPDATE ON "Chunk"
      FOR EACH ROW
      EXECUTE FUNCTION chunk_search_vector_update();
  `);

  // 3. Create GIN index if not exists
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS chunk_search_vector_idx
      ON "Chunk"
      USING GIN(search_vector);
  `);

  // 4. Backfill all existing chunks
  const updatedCount = await db.$executeRawUnsafe(`
    UPDATE "Chunk"
    SET search_vector = to_tsvector('english', coalesce(content, ''))
    WHERE search_vector IS NULL;
  `);

  console.log(`[SUCCESS] Backfilled ${updatedCount} chunks with search_vector!`);

  await db.$disconnect();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
