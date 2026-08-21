-- =============================================================================
-- BM25 Full-Text Search: search_vector trigger, GIN index, and backfill
-- =============================================================================
-- This migration enables true hybrid (vector + BM25) retrieval by:
--   1. Creating a PL/pgSQL function that converts chunk content to a tsvector
--   2. Attaching a BEFORE INSERT OR UPDATE trigger to keep search_vector in sync
--   3. Building a GIN index for fast tsvector query execution
--   4. Backfilling all existing chunks that have a NULL search_vector
-- =============================================================================

-- 1. PL/pgSQL function: converts content column to English tsvector
CREATE OR REPLACE FUNCTION chunk_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop existing trigger if present, then recreate
DROP TRIGGER IF EXISTS chunk_search_vector_trigger ON "Chunk";

CREATE TRIGGER chunk_search_vector_trigger
  BEFORE INSERT OR UPDATE OF content
  ON "Chunk"
  FOR EACH ROW
  EXECUTE FUNCTION chunk_search_vector_update();

-- 3. GIN index for fast full-text search on tsvector column
CREATE INDEX IF NOT EXISTS chunk_search_vector_idx
  ON "Chunk"
  USING GIN(search_vector);

-- 4. Backfill all existing chunks that have a NULL search_vector
UPDATE "Chunk"
SET search_vector = to_tsvector('english', coalesce(content, ''))
WHERE search_vector IS NULL;

-- Verification query (informational):
-- SELECT COUNT(*) AS total,
--        COUNT(search_vector) AS with_vector,
--        COUNT(*) - COUNT(search_vector) AS missing
-- FROM "Chunk";
