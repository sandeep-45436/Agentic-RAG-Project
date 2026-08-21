export type RetrievalStrategyMode =
  | "DENSE_VECTOR"
  | "HYBRID_SPARSE_DENSE"
  | "GRAPH_TRAVERSAL"
  | "DIRECT_POLICY_LOOKUP";

export interface StrategySelectionResult {
  mode: RetrievalStrategyMode;
  reason: string;
  recommendedTopK: number;
  enableGraphTraversal: boolean;
}

export class RetrievalStrategySelector {
  public static selectStrategy(
    queryText: string,
    intentCategory?: string
  ): StrategySelectionResult {
    const trimmed = queryText.toLowerCase();

    // 1. Direct Policy Lookup (Academic policy, rules, handbook)
    if (/\b(policy|handbook|regulation|rules|grading system|syllabus)\b/i.test(trimmed)) {
      return {
        mode: "DIRECT_POLICY_LOOKUP",
        reason: "Query targets university policy documentation",
        recommendedTopK: 5,
        enableGraphTraversal: true,
      };
    }

    // 2. Graph Traversal (Prerequisite dependencies, course chains)
    if (/\b(prerequisite|prereq|chain|depends on|pathway|sequence)\b/i.test(trimmed)) {
      return {
        mode: "GRAPH_TRAVERSAL",
        reason: "Query requests graph relationship traversal",
        recommendedTopK: 7,
        enableGraphTraversal: true,
      };
    }

    // 3. Hybrid Sparse/Dense RAG (Default for complex retrieval)
    if (intentCategory === "MULTI_STEP_COGNITIVE_GOAL" || trimmed.split(/\s+/).length > 6) {
      return {
        mode: "HYBRID_SPARSE_DENSE",
        reason: "Multi-step complex query requires BM25 + dense vector fusion",
        recommendedTopK: 5,
        enableGraphTraversal: false,
      };
    }

    // 4. Dense Vector Search (Simple semantic queries)
    return {
      mode: "DENSE_VECTOR",
      reason: "Fast-path dense semantic retrieval",
      recommendedTopK: 3,
      enableGraphTraversal: false,
    };
  }
}
