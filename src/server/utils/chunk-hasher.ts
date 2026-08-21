import crypto from "crypto";

/**
 * Normalizes text deterministically:
 * - CRLF -> LF
 * - Multiple whitespace/spaces -> single space
 * - Trim leading and trailing whitespace
 */
export function normalizeChunkText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

/**
 * Generates a SHA-256 hash for document content to detect duplicate uploads.
 */
export function generateDocumentHash(rawContent: string | Buffer): string {
  return crypto.createHash("sha256").update(rawContent).digest("hex");
}

/**
 * Generates a deterministic SHA-256 chunkHash and a valid UUID formatted chunkId.
 * Source string: `${documentId}_v${documentVersion}_${chunkIndex}_${normalizedText}`
 */
export function generateChunkHash(
  documentId: string,
  documentVersion: number,
  chunkIndex: number,
  rawText: string
): { chunkHash: string; chunkId: string } {
  const normalized = normalizeChunkText(rawText);
  const source = [documentId, `v${documentVersion}`, chunkIndex, normalized].join("_");
  const chunkHash = crypto.createHash("sha256").update(source).digest("hex");

  // Format hash as valid UUID (8-4-4-4-12 hex string) for vector DB compatibility
  const chunkId = [
    chunkHash.substring(0, 8),
    chunkHash.substring(8, 12),
    `4${chunkHash.substring(13, 16)}`,
    `8${chunkHash.substring(17, 20)}`,
    chunkHash.substring(20, 32),
  ].join("-");

  return { chunkHash, chunkId };
}
