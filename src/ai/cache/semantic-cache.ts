/**
 * Tenant- & Role-Partitioned Semantic Cache
 * 
 * Implements vector cosine similarity caching for LLM and RAG responses.
 * Crucial Enterprise Architecture:
 * - Never shares cache entries across different tenants (orgId).
 * - Partitions by departmentCode and userRole (STUDENT, FACULTY, HOD).
 * - Pins cache entries to an explicit academic regulation/policy version (e.g. 2026.1).
 * - Avoids expensive repeated LLM and vector DB queries for semantically equivalent inquiries.
 */

export interface CachedSemanticEntry {
  id: string;
  query: string;
  embedding: number[];
  answer: string;
  citations: string[];
  provenance: any[];
  timestamp: number;
  ttlSeconds: number;
}

export class SemanticCache {
  private static readonly COSINE_SIMILARITY_THRESHOLD = 0.94;
  private static partitionStore = new Map<string, CachedSemanticEntry[]>();

  /**
   * Generates a fully qualified multi-tenant partition key.
   * Format: `sem:{orgId}:{deptCode}:{userRole}:{policyVersion}`
   */
  public static buildPartitionKey(
    orgId: string,
    deptCode: string,
    userRole: string,
    policyVersion = "2026.1"
  ): string {
    const cleanOrg = orgId.toLowerCase().trim();
    const cleanDept = deptCode.toLowerCase().trim();
    const cleanRole = userRole.toUpperCase().trim();
    return `sem:${cleanOrg}:${cleanDept}:${cleanRole}:${policyVersion}`;
  }

  /**
   * Computes mathematical cosine similarity between two normalized vector embeddings.
   */
  public static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0.0;

    let dot = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0.0) return 0.0;

    return dot / denominator;
  }

  /**
   * Searches the designated partition for a semantic cache hit above the similarity threshold.
   */
  public static findMatch(
    partitionKey: string,
    queryEmbedding: number[]
  ): { entry: CachedSemanticEntry; similarity: number } | null {
    const entries = this.partitionStore.get(partitionKey) || [];
    const now = Date.now();

    for (let i = entries.length - 1; i >= 0; i--) {
      const item = entries[i];

      // Check TTL expiration
      if (now - item.timestamp > item.ttlSeconds * 1000) {
        entries.splice(i, 1);
        continue;
      }

      const similarity = this.cosineSimilarity(item.embedding, queryEmbedding);
      if (similarity >= this.COSINE_SIMILARITY_THRESHOLD) {
        return { entry: item, similarity };
      }
    }

    return null;
  }

  /**
   * Writes a verified answer entry into the partitioned semantic cache.
   */
  public static put(
    partitionKey: string,
    entry: Omit<CachedSemanticEntry, "id" | "timestamp">
  ): CachedSemanticEntry {
    let entries = this.partitionStore.get(partitionKey);
    if (!entries) {
      entries = [];
      this.partitionStore.set(partitionKey, entries);
    }

    const fullEntry: CachedSemanticEntry = {
      ...entry,
      id: `sc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };

    entries.push(fullEntry);
    return fullEntry;
  }

  /**
   * Invalidates an entire partition atomically (e.g. when regulations change or circulars are published).
   */
  public static invalidatePartition(partitionKey: string): { evictedCount: number } {
    const entries = this.partitionStore.get(partitionKey);
    const count = entries ? entries.length : 0;
    this.partitionStore.delete(partitionKey);
    return { evictedCount: count };
  }

  /**
   * Returns current statistics across the semantic cache store.
   */
  public static getStats(): { totalPartitions: number; totalEntries: number } {
    let totalEntries = 0;
    for (const entries of this.partitionStore.values()) {
      totalEntries += entries.length;
    }
    return {
      totalPartitions: this.partitionStore.size,
      totalEntries,
    };
  }

  public static clearAll(): void {
    this.partitionStore.clear();
  }
}
