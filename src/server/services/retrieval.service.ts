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
   *   3. Query Rewriting → Refines query with recent conversation history
   *   4. Multi-Query Expansion → Generates 3 query variations
   *   5. Parallel Retrieval (Normal + Memory Boost) → Searches all variations across Qdrant and Postgres, 
   *      and triggers dedicated queries scoped to the previously cited documents to ensure comparative accuracy
   *   6. Neo4j Graph structural path search
   *   7. Reciprocal Rank Fusion → Merges and ranks candidates + Graph context
   *   8. Cross-Encoder Reranking (local WASM BGE) → Filters to top 5
   *   9. Jaccard Context Compression → Prunes redundant context
   *  10. Multi-Document Synthesis → Custom prompt instructions if candidates span multiple files
   *  11. Trace Logging → Persists logs and variant entries in DB
   *  12. Return { prompt, chunks, debugInfo }
   */
  static async buildContextualPrompt(
    query: string,
    organizationId: string,
    chatHistory: Array<{ role: "user" | "assistant"; content: string; citations?: any }> = []
  ) {
    if (!query.trim()) throw new Error("Query cannot be empty.");

    const startTime = performance.now();
    const cacheKey = `retrieval:${organizationId}:${CacheService.hashKey(query.trim().toLowerCase())}`;

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

      // 2. Retrieval Memory & Token Budgeting
      const retrievalMemory = MemoryManagerService.extractRetrievalMemory(chatHistory);
      const citedDocIds = retrievalMemory.previouslyCitedDocumentIds;
      const budgetedHistory = MemoryManagerService.budgetChatHistory(chatHistory, 2500);

      if (citedDocIds.length > 0) {
        console.log(`[RetrievalService] Retrieval Memory active. Scoping extra searches for document IDs: ${citedDocIds.join(", ")}`);
      }

      // 3. Query Rewriting & Variant Generation (using budgeted history)
      const rewrittenQuery = await QueryIntelligenceService.rewriteQuery(query, budgetedHistory);
      const variants = await QueryIntelligenceService.generateVariants(rewrittenQuery, 3);
      const allQueryTexts = [rewrittenQuery, ...variants];

      // 4. Batch generate embeddings
      const queryVectors = await EmbeddingService.embedBatch(allQueryTexts, 1);

      // 5. Parallel retrieval across variations
      const vectorSearchPromises = queryVectors.map((vector) =>
        VectorService.similaritySearch(vector, organizationId, 12)
      );

      const bm25SearchPromises = allQueryTexts.map(async (text) => {
        const available = await BM25Service.isAvailable();
        if (!available) return [];
        return BM25Service.search(text, organizationId, 12);
      });

      // Retrieval Memory Boost: Trigger explicit searches targeting ONLY previously cited documents
      const memoryVectorSearchPromises = citedDocIds.length > 0
        ? queryVectors.map((vector) =>
            VectorService.similaritySearch(vector, organizationId, 10, citedDocIds)
          )
        : [];

      const memoryBm25SearchPromises = citedDocIds.length > 0
        ? allQueryTexts.map(async (text) => {
            const available = await BM25Service.isAvailable();
            if (!available) return [];
            return BM25Service.search(text, organizationId, 10, citedDocIds);
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
        GraphRetrievalService.retrieveGraphContext(rewrittenQuery, organizationId),
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
      if (allVectorResults.length > 0 && allBm25Results.length === 0) retrievalType = "vector";
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
      if (graphContext) {
        fusedResults.push({
          chunkId: uuidv4(),
          documentId: "graph-knowledge",
          documentName: "Knowledge Graph",
          organizationId,
          chunkText: graphContext,
          chunkIndex: 0,
          pageNumber: null,
          vectorScore: 1.0,
          vectorRank: 1,
          bm25Score: 1.0,
          bm25Rank: 1,
          fusionScore: 1.0,
          fusionRank: 1,
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
        await FusionService.enrichDocumentNames(fusedResults, nameMap);
      }

      // 8. Convert to VectorPayload format for reranking
      const payloadsForRerank = FusionService.toVectorPayloads(fusedResults);

      // 9. Cross-Encoder Reranking
      const top5Payloads = await RerankService.rerankChunks(rewrittenQuery, payloadsForRerank, 5);

      // 10. Context Compression (Jaccard token similarity deduplication)
      const compressedPayloads = CompressionService.compressContext(top5Payloads, 0.5);

      // 11. Format citations
      const formattedCitations = CitationService.formatCitations(compressedPayloads);

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

      // Build debug info
      const latencyMs = Math.round(performance.now() - startTime);

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
}

