/**
 * CacheLayer — in-process TTL-backed cache for the pipeline latency optimization.
 *
 * All state lives in a single static Map; no external dependencies are required.
 * Key helpers normalise query strings and apply distinct namespace prefixes so
 * that different cache domains never collide.
 *
 * Requirements covered: 6.1 – 6.12
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CacheEntry<T> {
  /** The cached value. */
  value: T;
  /** Unix-ms timestamp at which the entry expires (Date.now() + ttlMs). */
  expiresAt: number;
}

/** Shape of the CACHE_HIT structured log event. */
interface CacheHitLog {
  event: "CACHE_HIT";
  key: string;
  ttlRemainingSeconds: number;
  source: CacheSource;
}

type CacheSource =
  | "embedding"
  | "plan"
  | "retrieval"
  | "neo4j"
  | "userProfile"
  | "conversation";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Map from key prefix to human-readable source label. */
const PREFIX_TO_SOURCE: ReadonlyMap<string, CacheSource> = new Map([
  ["emb:", "embedding"],
  ["plan:", "plan"],
  ["ret:", "retrieval"],
  ["neo4j:", "neo4j"],
  ["up:", "userProfile"],
  ["conv:", "conversation"],
]);

/**
 * Derive the `source` label from a cache key by checking its leading prefix.
 * Falls back to `"embedding"` for unrecognised prefixes (should not occur in
 * normal usage).
 */
function deriveSource(key: string): CacheSource {
  for (const [prefix, source] of PREFIX_TO_SOURCE) {
    if (key.startsWith(prefix)) return source;
  }
  return "embedding";
}

/**
 * Emit a structured CACHE_HIT JSON log line to stdout.
 * Requirement 6.6 / design §4.
 */
function emitCacheHit(key: string, entry: CacheEntry<unknown>): void {
  const now = Date.now();
  const ttlRemainingSeconds = Math.floor((entry.expiresAt - now) / 1000);
  const log: CacheHitLog = {
    event: "CACHE_HIT",
    key,
    ttlRemainingSeconds,
    source: deriveSource(key),
  };
  console.log(JSON.stringify(log));
}

// ---------------------------------------------------------------------------
// Glob matching (inline — no external library)
// ---------------------------------------------------------------------------

/**
 * Simple glob matcher supporting:
 *   `*`  — matches any sequence of characters (including zero) within a
 *           key segment (i.e. does NOT cross `:` segment boundaries by design,
 *           but the spec says "* matches any sequence of characters in a key
 *           segment", so we implement it as matching within segments only).
 *   `**` — matches any sequence of characters including `:` segment
 *           separators (crosses segment boundaries).
 *
 * The implementation converts the glob to a RegExp, escaping all regex
 * meta-characters before substituting glob wildcards.
 */
function globToRegex(pattern: string): RegExp {
  // Split on `**` first so we can handle it separately from `*`.
  const parts = pattern.split("**");
  const escapedParts = parts.map((part) => {
    // Within each `**`-delimited segment, handle `*` and escape regex chars.
    return part
      .split("*")
      .map((s) => s.replace(/[.+^${}()|[\]\\]/g, "\\$&"))
      .join("[^:]*"); // `*` matches any chars except the `:` separator
  });
  // `**` matches any chars including `:` separators
  const regexStr = "^" + escapedParts.join(".*") + "$";
  return new RegExp(regexStr);
}

// ---------------------------------------------------------------------------
// CacheLayer
// ---------------------------------------------------------------------------

export class CacheLayer {
  /** Backing store shared across the process lifetime. */
  private static store = new Map<string, CacheEntry<unknown>>();

  // -------------------------------------------------------------------------
  // Core CRUD
  // -------------------------------------------------------------------------

  /**
   * Retrieve a cached value.
   *
   * Returns `null` if the key is absent or its TTL has expired (lazy eviction).
   * Emits a `CACHE_HIT` structured log on a valid hit.
   *
   * Requirement 6.1, 6.10
   */
  static get<T>(key: string): T | null {
    const entry = CacheLayer.store.get(key);
    if (!entry) return null;

    // Lazy TTL check — requirement 6.10
    if (Date.now() >= entry.expiresAt) {
      CacheLayer.store.delete(key);
      return null;
    }

    emitCacheHit(key, entry);
    return entry.value as T;
  }

  /**
   * Store a value under `key` with a TTL measured in whole seconds.
   *
   * `expiresAt = Date.now() + ttlSeconds * 1000`
   *
   * Requirement 6.2 (TTL stored at write time), 6.12 (write-through)
   */
  static set<T>(key: string, value: T, ttlSeconds: number): void {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    };
    CacheLayer.store.set(key, entry as CacheEntry<unknown>);
  }

  /**
   * Evict all entries whose keys match `pattern` (glob-style).
   *
   * Atomicity guarantee: all matching keys are collected before any deletion
   * occurs. If the collection step throws, no keys are deleted.
   *
   * Returns `{ evicted: number }` equal to the number of keys removed.
   *
   * Requirement 6.11
   */
  static async invalidate(pattern: string): Promise<{ evicted: number }> {
    const regex = globToRegex(pattern);

    // Collect matching keys before touching the store (atomic: all-or-nothing).
    const matchingKeys: string[] = [];
    for (const key of CacheLayer.store.keys()) {
      if (regex.test(key)) {
        matchingKeys.push(key);
      }
    }

    // Delete — at this point we have a complete list; partial eviction is not
    // possible because the collection loop already completed successfully.
    for (const key of matchingKeys) {
      CacheLayer.store.delete(key);
    }

    return { evicted: matchingKeys.length };
  }

  /**
   * Returns `true` if the key exists and has not yet expired.
   *
   * Requirement 6.1 (TTL check)
   */
  static isAlive(key: string): boolean {
    const entry = CacheLayer.store.get(key);
    if (!entry) return false;
    return Date.now() < entry.expiresAt;
  }

  // -------------------------------------------------------------------------
  // Normalised key helpers
  // -------------------------------------------------------------------------

  /**
   * Normalise a raw query string:
   *  - lowercase
   *  - collapse consecutive whitespace to a single space
   *  - trim leading/trailing whitespace
   *
   * Requirement 6 (Normalized_Query definition in glossary)
   */
  static normalize(query: string): string {
    return query.toLowerCase().replace(/\s+/g, " ").trim();
  }

  /**
   * Cache key for an embedding vector.
   * Namespace prefix: `"emb:"`
   * TTL reference: 3600 s
   *
   * Requirement 6.1, 6.2
   */
  static embeddingKey(query: string): string {
    return "emb:" + CacheLayer.normalize(query);
  }

  /**
   * Cache key for a `CognitivePlan`.
   * Namespace prefix: `"plan:"`
   * TTL reference: 300 s
   *
   * Requirement 6.3, 6.4
   */
  static planKey(query: string): string {
    return "plan:" + CacheLayer.normalize(query);
  }

  /**
   * Cache key for a retrieval result set.
   * Namespace prefix: `"ret:"`
   * Composite: `ret:{orgId}:{normalizedQuery}`
   * TTL reference: 120 s
   *
   * Requirement 6.5, 6.6
   */
  static retrievalKey(orgId: string, query: string): string {
    return "ret:" + orgId + ":" + CacheLayer.normalize(query);
  }

  /**
   * Cache key for a Neo4j graph traversal result.
   * Namespace prefix: `"neo4j:"`
   * Composite: `neo4j:{orgId}:{entityId}:{depth}`
   * TTL reference: 600 s
   *
   * Requirement 6.7
   */
  static neo4jKey(orgId: string, entityId: string, depth: number): string {
    return "neo4j:" + orgId + ":" + entityId + ":" + depth;
  }

  /**
   * Cache key for a user profile.
   * Namespace prefix: `"up:"`
   * TTL reference: 900 s
   *
   * Requirement 6.8
   */
  static userProfileKey(userId: string): string {
    return "up:" + userId;
  }

  /**
   * Cache key for a conversation summary.
   * Namespace prefix: `"conv:"`
   * Composite: `conv:{userId}:{sessionId}`
   * TTL reference: 1800 s
   *
   * Requirement 6.9
   */
  static conversationKey(userId: string, sessionId: string): string {
    return "conv:" + userId + ":" + sessionId;
  }
}

// ---------------------------------------------------------------------------
// TTL constants (informational — callers pass ttlSeconds explicitly)
// ---------------------------------------------------------------------------

/** Reference TTL values in seconds, one per cache namespace. */
export const CACHE_TTL = {
  /** Embedding vectors: 1 hour. Requirement 6.2 */
  EMBEDDING: 3600,
  /** Cognitive plans: 5 minutes. Requirement 6.3 */
  PLAN: 300,
  /** Retrieval results: 2 minutes. Requirement 6.5 */
  RETRIEVAL: 120,
  /** Neo4j traversal results: 10 minutes. Requirement 6.7 */
  NEO4J: 600,
  /** User profile data: 15 minutes. Requirement 6.8 */
  USER_PROFILE: 900,
  /** Conversation summaries: 30 minutes. Requirement 6.9 */
  CONVERSATION: 1800,
} as const;
