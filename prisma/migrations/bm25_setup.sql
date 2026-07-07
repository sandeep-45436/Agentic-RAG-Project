-- =============================================================================
-- NexusIQ Phase 1: BM25 Full-Text Search Setup
-- =============================================================================
-- This migration adds PostgreSQL full-text search capabilities to the Chunk
-- table, enabling BM25-style keyword retrieval alongside Qdrant vector search.
-- =============================================================================

-- Step 1: Add tsvector column for full-text search
ALTER TABLE "Chunk" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Step 2: Populate search_vector from existing content
UPDATE "Chunk" SET "search_vector" = to_tsvector('english', content)
WHERE "search_vector" IS NULL;

-- Step 3: Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_chunk_search_vector ON "Chunk" USING GIN ("search_vector");

-- Step 4: Create composite index for org-scoped full-text queries
CREATE INDEX IF NOT EXISTS idx_chunk_org_search ON "Chunk" ("organizationId") WHERE "deletedAt" IS NULL;

-- Step 5: Create trigger to auto-update search_vector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION chunk_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW."search_vector" := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chunk_search_vector ON "Chunk";
CREATE TRIGGER trg_chunk_search_vector
  BEFORE INSERT OR UPDATE OF content ON "Chunk"
  FOR EACH ROW EXECUTE FUNCTION chunk_search_vector_trigger();
