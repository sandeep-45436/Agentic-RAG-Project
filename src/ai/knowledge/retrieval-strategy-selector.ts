import { AcademicPolicyCache } from "../cag/academic-policy-cache";

export type RetrievalStrategyMode =
  | "CAG_CONTEXT_CACHE"       // Zero-latency static context cache (Grading, Degree rules, credit thresholds)
  | "DIRECT_POLICY_LOOKUP"    // Targeted retrieval on formal policy documents
  | "GRAPH_TRAVERSAL"         // Prerequisite hierarchies & course dependencies (Neo4j)
  | "HYBRID_SPARSE_DENSE"     // Dense vector (Qdrant) + Sparse (BM25) fusion
  | "DENSE_VECTOR";           // Semantic vector search

export interface StrategySelectionResult {
  mode: RetrievalStrategyMode;
  reason: string;
  recommendedTopK: number;
  enableGraphTraversal: boolean;
  useCagCache: boolean;
}

export class RetrievalStrategySelector {
  public static selectStrategy(
    queryText: string,
    intentCategory?: string
  ): StrategySelectionResult {
    const trimmed = queryText.toLowerCase();

    // 1. CAG Context Cache (Static institutional policies, grading system, degree credit totals)
    const staticCheck = AcademicPolicyCache.resolveStaticQuery(queryText);
    if (staticCheck.matched || /\b(grading scale|passing grade|credits required for degree|degree credits|honours criteria)\b/i.test(trimmed)) {
      return {
        mode: "CAG_CONTEXT_CACHE",
        reason: "Query satisfied by pre-loaded Academic Policy Cache (CAG Layer); eliminates vector DB latency",
        recommendedTopK: 0,
        enableGraphTraversal: false,
        useCagCache: true,
      };
    }

    // 2. Graph Traversal (Prerequisite dependencies, course chains, curriculum paths)
    if (/\b(prerequisite|prereq|chain|depends on|pathway|sequence|curriculum tree)\b/i.test(trimmed)) {
      return {
        mode: "GRAPH_TRAVERSAL",
        reason: "Query requests graph relationship traversal for academic dependencies",
        recommendedTopK: 7,
        enableGraphTraversal: true,
        useCagCache: false,
      };
    }

    // 3. Direct Policy Lookup (Dynamic circulars, specific regulation clauses, handbooks)
    if (/\b(circular|memo|regulation clause|handbook section|notification)\b/i.test(trimmed)) {
      return {
        mode: "DIRECT_POLICY_LOOKUP",
        reason: "Query targets specific institutional circulars and regulation clauses",
        recommendedTopK: 5,
        enableGraphTraversal: true,
        useCagCache: false,
      };
    }

    // 4. Hybrid Sparse/Dense RAG (Default for multi-step / complex retrieval)
    if (intentCategory === "MULTI_STEP_COGNITIVE_GOAL" || trimmed.split(/\s+/).length > 6) {
      return {
        mode: "HYBRID_SPARSE_DENSE",
        reason: "Multi-step complex query requires BM25 lexical + dense vector fusion",
        recommendedTopK: 5,
        enableGraphTraversal: false,
        useCagCache: false,
      };
    }

    // 5. Dense Vector Search (Simple semantic queries)
    return {
      mode: "DENSE_VECTOR",
      reason: "Fast-path dense semantic retrieval",
      recommendedTopK: 3,
      enableGraphTraversal: false,
      useCagCache: false,
    };
  }
}
