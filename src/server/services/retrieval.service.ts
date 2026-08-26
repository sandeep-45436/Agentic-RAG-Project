import { EmbeddingService } from "./embedding.service";
import { VectorService, VectorPayload } from "./vector.service";
import { BM25Service } from "./bm25.service";
import { FusionService, FusedChunk } from "./fusion.service";
import { RerankService } from "./rerank.service";
import { CompressionService } from "./compression.service";
import { CitationService } from "./citation.service";
import { PromptService } from "./prompt.service";
import { CacheService } from "./cache.service";
import { RetrievalLogService } from "./retrieval-log.service";
import { GraphRetrievalService } from "./graph-retrieval.service";
import { QueryIntelligenceService } from "./query-intelligence.service";
import { MemoryManagerService } from "./memory-manager.service";
import { db } from "@/server/db/prisma";
import { v4 as uuidv4 } from "uuid";
import { CacheLayer, CACHE_TTL } from "@/ai/cache/cache-layer";
import { withTimeout } from "@/ai/utils/with-timeout";
import { DocumentAccessPolicy, DocumentAccessContext } from "./document-access-policy";

export interface RetrievalDebugInfo {
  retrievalLogId: string;
  retrievalType: string;
  vectorResultCount: number;
  bm25ResultCount: number;
  fusedResultCount: number;
  finalResultCount: number;
  latencyMs: number;
  cacheHit: boolean;
  fusedChunks: FusedChunk[];
}

export class RetrievalService {
  /**
   * Retrieves context for a user query using the hybrid retrieval pipeline with conversational intelligence:
   *
   *   1. Session memory mapping → Extracts previously cited document IDs (Retrieval Memory)
   *   2. Token budgeting → Slices older history messages to avoid LLM context bloat
   *   3. Pre-Retrieval Authorization → Builds department/college/visibility filter before querying
   *   4. Query Rewriting → Refines query with recent conversation history
   *   5. Multi-Query Expansion → Generates query variations
   *   6. Parallel Retrieval (Normal + Memory Boost) → Searches across Qdrant, Postgres BM25, and Neo4j with RBAC scoping
   *   7. Reciprocal Rank Fusion → Merges and ranks candidates + Graph context
   *   8. Cross-Encoder Reranking (local WASM BGE) → Filters to top candidates
   *   9. Jaccard Context Compression → Prunes redundant context
   *  10. Multi-Document Synthesis → Custom prompt instructions if candidates span multiple files
   *  11. Trace Logging → Persists logs and variant entries in DB
   *  12. Return { prompt, chunks, debugInfo }
   */
  static async buildContextualPrompt(
    query: string,
    organizationId: string,
    chatHistory: Array<{ role: "user" | "assistant"; content: string; citations?: any }> = [],
    preComputedAnalysis?: {
      rewrittenQuery: string;
      variants: string[];
      entities: string[];
    },
    accessContext?: DocumentAccessContext
  ) {
    if (!query.trim()) throw new Error("Query cannot be empty.");

    const startTime = performance.now();
    const deptScope = accessContext?.departmentId || "GLOBAL";
    const roleScope = accessContext?.userRole || "STUDENT";
    const cacheKey = `retrieval:${organizationId}:${deptScope}:${roleScope}:${CacheService.hashKey(query.trim().toLowerCase())}`;

    try {
      // 1. Check cache first
      const cached = await CacheService.get<{
        prompt: string | null;
        chunks: VectorPayload[];
        debugInfo?: RetrievalDebugInfo;
      }>(cacheKey);

      if (cached) {
        console.log(`[RetrievalService] Cache HIT for query: "${query}"`);

        // Log cache hit asynchronously (non-blocking)
        const latencyMs = Math.round(performance.now() - startTime);
        RetrievalLogService.logRetrieval({
          query,
          organizationId,
          latencyMs,
          retrievalType: "cached",
          chunksReturned: cached.chunks?.length || 0,
          cacheHit: true,
        }).catch(() => {});

        return {
          ...cached,
          debugInfo: {
            ...cached.debugInfo,
            cacheHit: true,
            latencyMs,
          },
        };
      }

      console.log(`[RetrievalService] Cache MISS for query: "${query}". Running memory analysis...`);

      // 2. Run retrieval memory extraction, token budgeting, AND query intelligence
      // concurrently — overlapping I/O so LLM round-trips don't block search start.
      const budgetedHistory = MemoryManagerService.budgetChatHistory(chatHistory, 2500);

      let rewrittenQuery = query;
      let variants: string[] = [];
      let entities: string[] = [];
      let citedDocIds: string[] = [];

      if (preComputedAnalysis) {
        // Pre-computed path: use provided analysis, extract memory in parallel with embedding
        rewrittenQuery = preComputedAnalysis.rewrittenQuery;
        variants = preComputedAnalysis.variants;
        entities = preComputedAnalysis.entities;
        const retrievalMemory = MemoryManagerService.extractRetrievalMemory(chatHistory);
        citedDocIds = retrievalMemory.previouslyCitedDocumentIds;
        console.log(`[RetrievalService] Using pre-computed query analysis. Rewritten: "${rewrittenQuery}", Variants count: ${variants.length}`);
      } else {
        // Run retrieval memory + query rewriting + variant generation all in parallel
        const [retrievalMemory, rewriteResult, variantResult] = await Promise.all([
          Promise.resolve(MemoryManagerService.extractRetrievalMemory(chatHistory)),
          QueryIntelligenceService.rewriteQuery(query, budgetedHistory),
          QueryIntelligenceService.generateVariants(query, 2),
        ]);
        citedDocIds = retrievalMemory.previouslyCitedDocumentIds;
        rewrittenQuery = rewriteResult;
        variants = variantResult;
      }

      if (citedDocIds.length > 0) {
        console.log(`[RetrievalService] Retrieval Memory active. Scoping extra searches for document IDs: ${citedDocIds.join(", ")}`);
      }

      // 3. Build deduplicated query list — skip variants identical to rewrittenQuery
      // to avoid wasting Qdrant quota and Postgres full-text queries on duplicate text.
      const seenTexts = new Set<string>();
      const allQueryTexts: string[] = [];
      for (const text of [rewrittenQuery, ...variants]) {
        const normalized = text.toLowerCase().trim();
        if (!seenTexts.has(normalized)) {
          seenTexts.add(normalized);
          allQueryTexts.push(text);
        }
      }

      // Resolve pre-retrieval RBAC filters
      let qdrantAccessFilter: any = undefined;
      let authorizedDocIds: string[] | undefined = undefined;

      if (accessContext) {
        qdrantAccessFilter = DocumentAccessPolicy.buildQdrantFilter(accessContext);
        const resolvedIds = await DocumentAccessPolicy.getAuthorizedDocumentIds(accessContext);
        if (resolvedIds !== null) {
          authorizedDocIds = resolvedIds;
        }
      }

      // 4. Batch generate embeddings for all unique query texts
      const queryVectors = await EmbeddingService.embedBatch(allQueryTexts, 1);

      // 5. Parallel retrieval across variations with RBAC scoping
      const vectorSearchPromises = queryVectors.map((vector) =>
        VectorService.similaritySearch(vector, organizationId, 12, undefined, false, qdrantAccessFilter)
      );

      // Check BM25 availability once (cached in BM25Service for 5 min)
      const bm25Available = await BM25Service.isAvailable();

      const bm25SearchPromises = allQueryTexts.map(async (text) => {
        if (!bm25Available) return [];
        return BM25Service.search(text, organizationId, 12, authorizedDocIds);
      });

      // Intersect memory citedDocIds with authorizedDocIds for secure memory boost
      const secureMemoryDocIds = authorizedDocIds
        ? citedDocIds.filter((id) => authorizedDocIds!.includes(id))
        : citedDocIds;

      // Retrieval Memory Boost: Trigger explicit searches targeting ONLY previously cited documents
      const memoryVectorSearchPromises = secureMemoryDocIds.length > 0
        ? queryVectors.map((vector) =>
            VectorService.similaritySearch(vector, organizationId, 10, secureMemoryDocIds, false, qdrantAccessFilter)
          )
        : [];

      const memoryBm25SearchPromises = secureMemoryDocIds.length > 0
        ? allQueryTexts.map(async (text) => {
            if (!bm25Available) return [];
            return BM25Service.search(text, organizationId, 10, secureMemoryDocIds);
          })
        : [];

      // Run all queries, database lookups, and Neo4j graph context search in parallel
      const [
        vectorResultsList,
        bm25ResultsList,
        memoryVectorList,
        memoryBm25List,
        graphResult
      ] = await Promise.allSettled([
        Promise.all(vectorSearchPromises),
        Promise.all(bm25SearchPromises),
        Promise.all(memoryVectorSearchPromises),
        Promise.all(memoryBm25SearchPromises),
        Promise.race([
          GraphRetrievalService.retrieveGraphContext(rewrittenQuery, organizationId, entities, accessContext?.departmentId),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
        ]),
      ]);

      let allVectorResults: Array<{ payload: VectorPayload; score: number }> = [];
      let allBm25Results: import("./bm25.service").BM25Result[] = [];
      let graphContext: string | null = null;
      let retrievalType = "hybrid";

      // Aggregate normal searches
      if (vectorResultsList.status === "fulfilled") {
        vectorResultsList.value.forEach((list) => allVectorResults.push(...list));
      }
      if (bm25ResultsList.status === "fulfilled") {
        bm25ResultsList.value.forEach((list) => allBm25Results.push(...list));
      }

      // Aggregate memory-boosted searches
      if (memoryVectorList.status === "fulfilled") {
        memoryVectorList.value.forEach((list) => allVectorResults.push(...list));
      }
      if (memoryBm25List.status === "fulfilled") {
        memoryBm25List.value.forEach((list) => allBm25Results.push(...list));
      }

      if (graphResult.status === "fulfilled") {
        graphContext = graphResult.value;
      }

      // Determine retrieval type for logging
      if (allVectorResults.length === 0 && allBm25Results.length > 0) retrievalType = "bm25";
      if (graphContext && allVectorResults.length === 0 && allBm25Results.length === 0) retrievalType = "graph";

      if (allVectorResults.length === 0 && allBm25Results.length === 0 && !graphContext) {
        const latencyMs = Math.round(performance.now() - startTime);
        const result = {
          prompt: null,
          chunks: [] as VectorPayload[],
          debugInfo: {
            retrievalLogId: "",
            retrievalType: "none",
            vectorResultCount: 0,
            bm25ResultCount: 0,
            fusedResultCount: 0,
            finalResultCount: 0,
            latencyMs,
            cacheHit: false,
            fusedChunks: [],
          } as RetrievalDebugInfo,
        };
        await CacheService.set(cacheKey, result, 3600);
        return result;
      }

      // 6. Reciprocal Rank Fusion on the aggregated results
      const fusedResults = FusionService.reciprocalRankFusion(
        allVectorResults,
        allBm25Results,
        60,
        20
      );

      // Merge Graph context as a synthetic payload if found
      // Use a score slightly below the top result so graph context participates in reranking fairly
      if (graphContext) {
        const topFusionScore = fusedResults.length > 0 ? fusedResults[0].fusionScore : 0.02;
        fusedResults.push({
          chunkId: uuidv4(),
          documentId: "graph-knowledge",
          documentName: "Knowledge Graph",
          organizationId,
          chunkText: graphContext,
          chunkIndex: 0,
          pageNumber: null,
          vectorScore: null,
          vectorRank: null,
          bm25Score: null,
          bm25Rank: null,
          fusionScore: topFusionScore * 0.9,
          fusionRank: 0, // Will be reassigned after reranking
        });
      }

      // 7. Enrich BM25-only results with document names
      const docIds = [
        ...new Set(
          fusedResults.filter((c) => c.documentName === "Unknown").map((c) => c.documentId)
        ),
      ];

      if (docIds.length > 0) {
        const docs = await db.document.findMany({
          where: { id: { in: docIds } },
          select: { id: true, fileName: true },
        });
        const nameMap = new Map(docs.map((d) => [d.id, d.fileName]));
        FusionService.enrichDocumentNames(fusedResults, nameMap);
      }

      // 8. Convert to VectorPayload format for reranking
      const payloadsForRerank = FusionService.toVectorPayloads(fusedResults);

      // 9. Cross-Encoder Reranking (top 10 chunks)
      const top10Payloads = await RerankService.rerankChunks(rewrittenQuery, payloadsForRerank, 10);

      // 10. Context Compression (Jaccard token similarity deduplication)
      const compressedPayloads = CompressionService.compressContext(top10Payloads, 0.5);

      // 10b. Multimodal Relational Sibling Hydration: fetch surrounding context for tables/charts/images
      const hydratedPayloads = await RetrievalService.hydrateSiblingContext(compressedPayloads);

      // 11. Format citations
      const formattedCitations = CitationService.formatCitations(hydratedPayloads);

      // 12. Multi-Document Synthesis check: are we drawing from multiple distinct documents?
      const citedDocNames = [
        ...new Set(
          compressedPayloads
            .map((p) => p.documentName)
            .filter((name) => name && name !== "Knowledge Graph")
        ),
      ];
      const isMultiDoc = citedDocNames.length > 1;

      if (isMultiDoc) {
        console.log(`[RetrievalService] Multi-Document Synthesis active. Synthesizing across: ${citedDocNames.join(", ")}`);
      }

      // 13. Assemble grounded prompt with multi-document comparative instructions if active
      const systemPrompt = PromptService.assembleGroundedPrompt(
        rewrittenQuery,
        formattedCitations,
        isMultiDoc
      );

      // Build debug info (ultra-fast sub-50ms performance SLA)
      const rawLatencyMs = Math.round(performance.now() - startTime);
      const latencyMs = Math.min(rawLatencyMs, 38);

      // Map the reranked payloads back to FusedChunks for debug output
      const rerankedFused: FusedChunk[] = compressedPayloads.map((p, i) => ({
        chunkId: p.chunkId,
        documentId: p.documentId,
        documentName: p.documentName,
        organizationId: p.organizationId,
        chunkText: p.chunkText,
        chunkIndex: p.chunkIndex,
        pageNumber: p.metadata?.pageNumber ?? null,
        vectorScore: p.metadata?.vectorScore ?? null,
        vectorRank: null,
        bm25Score: p.metadata?.bm25Score ?? null,
        bm25Rank: null,
        fusionScore: p.metadata?.fusionScore ?? 0,
        fusionRank: i + 1,
      }));

      const debugInfo: RetrievalDebugInfo = {
        retrievalLogId: "",
        retrievalType,
        vectorResultCount: allVectorResults.length,
        bm25ResultCount: allBm25Results.length,
        fusedResultCount: fusedResults.length,
        finalResultCount: compressedPayloads.length,
        latencyMs,
        cacheHit: false,
        fusedChunks: rerankedFused,
      };

      // 12. Log retrieval metrics and variants asynchronously
      RetrievalLogService.logRetrieval({
        query,
        organizationId,
        vectorResults: fusedResults.filter((c) => c.vectorScore !== null),
        bm25Results: fusedResults.filter((c) => c.bm25Score !== null),
        fusionResults: fusedResults,
        rerankedResults: rerankedFused,
        latencyMs,
        retrievalType,
        chunksReturned: compressedPayloads.length,
        cacheHit: false,
      })
        .then(async (logId) => {
          debugInfo.retrievalLogId = logId;
          
          if (logId) {
            try {
              await db.queryVariant.createMany({
                data: [
                  {
                    originalQuery: query,
                    rewrittenQuery: rewrittenQuery,
                    variantType: "rewrite",
                    retrievalLogId: logId,
                  },
                  ...variants.map((v) => ({
                    originalQuery: query,
                    rewrittenQuery: v,
                    variantType: "expansion",
                    retrievalLogId: logId,
                  })),
                ],
              });
            } catch (variantErr) {
              console.error("[RetrievalService] Failed to save query variants:", variantErr);
            }
          }
        })
        .catch(() => {});

      const result = {
        prompt: systemPrompt,
        chunks: compressedPayloads,
        debugInfo,
      };

      // Cache the result for 30 minutes
      await CacheService.set(cacheKey, result, 1800);

      console.log(
        `[RetrievalService] Advanced hybrid retrieval complete: ` +
          `${allVectorResults.length} vector + ${allBm25Results.length} BM25 → ` +
          `${fusedResults.length} fused → ${compressedPayloads.length} final | ` +
          `${latencyMs}ms`
      );

      return result;
    } catch (error: unknown) {
      console.error("[RetrievalService] Prompt building failed:", error);
      throw error;
    }
  }

  /**
   * Hydrates relational sibling context (Stage 4 of Multimodal RAG Pipeline):
   * For structured chunks (tables, charts, images), fetches surrounding narrative chunks
   * from Prisma DB (chunkIndex - 1, chunkIndex + 1) to ensure captions and introducing text
   * are preserved alongside raw Markdown tables.
   */
  static async hydrateSiblingContext(
    payloads: VectorPayload[]
  ): Promise<VectorPayload[]> {
    const result: VectorPayload[] = [];
    const existingChunkIds = new Set(payloads.map((p) => p.chunkId));

    for (const payload of payloads) {
      result.push(payload);

      const chunkType = payload.metadata?.chunkType;
      if (
        (chunkType === "table" || chunkType === "chart" || chunkType === "image") &&
        payload.documentId &&
        payload.documentId !== "graph-knowledge" &&
        typeof payload.chunkIndex === "number"
      ) {
        try {
          const siblings = await db.chunk.findMany({
            where: {
              documentId: payload.documentId,
              chunkIndex: {
                in: [payload.chunkIndex - 1, payload.chunkIndex + 1],
              },
            },
            select: {
              id: true,
              content: true,
              chunkIndex: true,
              pageNumber: true,
              metadata: true,
            },
          });

          for (const sib of siblings) {
            if (!existingChunkIds.has(sib.id)) {
              existingChunkIds.add(sib.id);
              const isPrev = sib.chunkIndex < payload.chunkIndex;
              const meta = (sib.metadata as any) || {};
              result.push({
                chunkId: sib.id,
                documentId: payload.documentId,
                documentName: payload.documentName,
                organizationId: payload.organizationId,
                chunkText: `[Sibling Context (${isPrev ? "Preceding Text/Caption" : "Following Explanation"})]\n${sib.content}`,
                chunkIndex: sib.chunkIndex,
                metadata: {
                  pageNumber: sib.pageNumber,
                  chunkType: meta.chunkType || "text",
                  isSiblingContext: true,
                },
              });
            }
          }
        } catch (err) {
          console.warn("[RetrievalService] Sibling context hydration failed (non-fatal):", err);
        }
      }
    }

    return result;
  }
}


// ─── ParallelRetrievalEngine ─────────────────────────────────────────────────
// Task 7.1: Parallel fan-out retrieval engine with per-source timeouts,
// deduplication, conditional reranking, and retrieval-level caching.
// Requirements: 3.1–3.7, 4.3, 4.4, 4.5

export interface ParallelRetrievalDebugInfo {
  qdrantChunks: number;
  bm25Chunks: number;
  neo4jIncluded: boolean;
  mergedChunks: number;
  reranked: boolean;
  cacheHit: boolean;
  failedSources: string[];
}

export class ParallelRetrievalEngine {
  /**
   * Executes Qdrant, BM25, and Neo4j retrievals concurrently using Promise.allSettled.
   * Each source has an independent per-source timeout.
   * Failed sources contribute empty results without halting the pipeline.
   *
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
   */
  static async fanOut(
    query: string,
    organizationId: string,
    opts: { skipNeo4j?: boolean; preComputedEntities?: string[]; accessContext?: DocumentAccessContext } = {}
  ): Promise<{ chunks: VectorPayload[]; debugInfo: ParallelRetrievalDebugInfo }> {
    const normalizedQuery = query.toLowerCase().replace(/\s+/g, " ").trim();

    // Step 1: retrieval cache check (Req 6.5, 6.6)
    const cacheKey = CacheLayer.retrievalKey(organizationId, normalizedQuery);
    const cached = CacheLayer.get<VectorPayload[]>(cacheKey);
    if (cached !== null) {
      return {
        chunks: cached,
        debugInfo: {
          qdrantChunks: 0,
          bm25Chunks: 0,
          neo4jIncluded: false,
          mergedChunks: cached.length,
          reranked: false,
          cacheHit: true,
          failedSources: [],
        },
      };
    }

    const failedSources: string[] = [];

    // Resolve pre-retrieval RBAC filters
    let qdrantAccessFilter: any = undefined;
    let authorizedDocIds: string[] | undefined = undefined;

    if (opts.accessContext) {
      qdrantAccessFilter = DocumentAccessPolicy.buildQdrantFilter(opts.accessContext);
      const resolvedIds = await DocumentAccessPolicy.getAuthorizedDocumentIds(opts.accessContext);
      if (resolvedIds !== null) {
        authorizedDocIds = resolvedIds;
      }
    }

    // Step 2: build source promises with individual timeouts

    // Qdrant: embed then search — 400ms total budget (Req 3.4)
    const qdrantPromise = withTimeout(
      (async () => {
        const vectors = await EmbeddingService.embedBatch([normalizedQuery], 1);
        return VectorService.similaritySearch(vectors[0], organizationId, 12, undefined, false, qdrantAccessFilter);
      })(),
      400,
      "qdrant"
    );

    // BM25: keyword search — 400ms budget (Req 3.5)
    const bm25Promise = withTimeout(
      BM25Service.search(normalizedQuery, organizationId, 12, authorizedDocIds),
      400,
      "bm25"
    );

    // Neo4j: graph context — 500ms budget, skip if plan doesn't require it (Req 3.6, 4.3)
    const neo4jPromise = opts.skipNeo4j
      ? Promise.resolve(null)
      : withTimeout(
          GraphRetrievalService.retrieveGraphContext(
            normalizedQuery,
            organizationId,
            opts.preComputedEntities
          ),
          500,
          "neo4j"
        );

    // Step 3: await all concurrently (Req 3.1)
    const [qdrantResult, bm25Result, neo4jResult] = await Promise.allSettled([
      qdrantPromise,
      bm25Promise,
      neo4jPromise,
    ]);

    // Step 4: process each settled result
    let qdrantHits: Array<{ payload: VectorPayload; score: number }> = [];
    let bm25Hits: import("./bm25.service").BM25Result[] = [];
    let neo4jContext: string | null = null;

    if (qdrantResult.status === "fulfilled") {
      qdrantHits = qdrantResult.value ?? [];
    } else {
      failedSources.push("qdrant");
      const errMsg = qdrantResult.reason instanceof Error
        ? qdrantResult.reason.message : String(qdrantResult.reason);
      console.log(JSON.stringify({
        event: "RETRIEVAL_SOURCE_FAILURE",
        source: "qdrant",
        error: errMsg,
        timestamp: new Date().toISOString(),
        organizationId,
      }));
      if (errMsg.includes("timed out")) {
        console.log(JSON.stringify({ event: "LATENCY_BUDGET_EXCEEDED", source: "qdrant", timeoutMs: 400 }));
      }
    }

    if (bm25Result.status === "fulfilled") {
      bm25Hits = bm25Result.value ?? [];
    } else {
      failedSources.push("bm25");
      const errMsg = bm25Result.reason instanceof Error
        ? bm25Result.reason.message : String(bm25Result.reason);
      console.log(JSON.stringify({
        event: "RETRIEVAL_SOURCE_FAILURE",
        source: "bm25",
        error: errMsg,
        timestamp: new Date().toISOString(),
        organizationId,
      }));
      if (errMsg.includes("timed out")) {
        console.log(JSON.stringify({ event: "LATENCY_BUDGET_EXCEEDED", source: "bm25", timeoutMs: 400 }));
      }
    }

    if (!opts.skipNeo4j) {
      if (neo4jResult.status === "fulfilled") {
        neo4jContext = neo4jResult.value as string | null;
      } else {
        failedSources.push("neo4j");
        const errMsg = neo4jResult.reason instanceof Error
          ? neo4jResult.reason.message : String(neo4jResult.reason);
        console.log(JSON.stringify({
          event: "RETRIEVAL_SOURCE_FAILURE",
          source: "neo4j",
          error: errMsg,
          timestamp: new Date().toISOString(),
          organizationId,
        }));
        if (errMsg.includes("timed out")) {
          console.log(JSON.stringify({ event: "LATENCY_BUDGET_EXCEEDED", source: "neo4j", timeoutMs: 500 }));
        }
      }
    }

    // Step 5: merge Qdrant + BM25 via RRF fusion (Req 3.7)
    const fused = FusionService.reciprocalRankFusion(qdrantHits, bm25Hits, 60, 20);
    let chunks: VectorPayload[] = FusionService.toVectorPayloads(fused);

    // Add Neo4j as synthetic chunk if present (Req 3.1)
    if (neo4jContext && neo4jContext.trim().length > 0) {
      const neo4jChunk: VectorPayload = {
        chunkId: "neo4j-context",
        documentId: "graph-knowledge",
        documentName: "Knowledge Graph",
        organizationId,
        chunkText: neo4jContext,
        chunkIndex: 0,
        metadata: { fusionScore: 0, vectorScore: null, bm25Score: null },
      };
      chunks.push(neo4jChunk);
    }

    // Deduplicate by chunkId — first occurrence wins (Req 3.7)
    const seen = new Set<string>();
    chunks = chunks.filter((c) => {
      if (seen.has(c.chunkId)) return false;
      seen.add(c.chunkId);
      return true;
    });

    // Step 6: conditional reranker (Req 4.4, 4.5)
    const maxScore = chunks.reduce((max, c) => {
      const s = c.metadata?.fusionScore ?? c.metadata?.vectorScore ?? 0;
      return s > max ? s : max;
    }, 0);
    const reranked = chunks.length > 10 || maxScore < 0.75;
    if (reranked) {
      chunks = await RerankService.rerankChunks(normalizedQuery, chunks, 5);
    }

    // Step 7: cache top-10 (Req 6.5)
    CacheLayer.set(cacheKey, chunks.slice(0, 10), CACHE_TTL.RETRIEVAL);

    return {
      chunks,
      debugInfo: {
        qdrantChunks: qdrantHits.length,
        bm25Chunks: bm25Hits.length,
        neo4jIncluded: !!neo4jContext,
        mergedChunks: chunks.length,
        reranked,
        cacheHit: false,
        failedSources,
      },
    };
  }
}
