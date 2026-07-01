import { VectorService, VectorPayload } from "@/server/services/vector.service";
import { RerankService } from "@/server/services/rerank.service";
import { CompressionService } from "@/server/services/compression.service";
import { EmbeddingService } from "@/server/services/embedding.service";
import { GraphRetrievalService } from "@/server/services/graph-retrieval.service";
import { v4 as uuidv4 } from "uuid";

/**
 * Isolated tool that interacts with Qdrant and Neo4j for Hybrid Retrieval,
 * ensuring that Agents cannot perform uncontrolled recursive database loops.
 */
export class RetrievalTool {
  static async run(query: string, organizationId: string) {
    if (!query || !organizationId) {
      return [];
    }

    try {
      // --- SEMANTIC PATH (Qdrant) ---
      const vectors = await EmbeddingService.embedBatch([query], 1);
      let semanticPayloads: VectorPayload[] = [];
      if (vectors && vectors.length > 0) {
        const top20Results = await VectorService.similaritySearch(vectors[0], organizationId, 20);
        semanticPayloads = top20Results.map((hit) => hit.payload as any);
      }

      // --- STRUCTURAL PATH (Neo4j Graph RAG) ---
      const graphContext = await GraphRetrievalService.retrieveGraphContext(query, organizationId);
      
      // Merge Graph context as a synthetic payload if found
      if (graphContext) {
        semanticPayloads.push({
          organizationId,
          documentId: "graph-knowledge",
          documentName: "Knowledge Graph",
          chunkId: uuidv4(),
          chunkIndex: 0,
          chunkText: graphContext,
        });
      }
      
      if (semanticPayloads.length === 0) return [];

      // 3. Rerank to Top 5 (The LLM judge will easily recognize the value of the structural graph payload)
      const reranked = await RerankService.rerankChunks(query, semanticPayloads, 5);

      // 4. Compress
      const compressed = CompressionService.compressContext(reranked);

      return compressed;
    } catch (error) {
      console.error("[RetrievalTool] Failed to run hybrid retrieval:", error);
      return [];
    }
  }
}
