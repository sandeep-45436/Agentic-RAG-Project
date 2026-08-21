import { VectorPayload } from "@/server/services/vector.service";

export interface EvidenceNode {
  id: string;
  label: string;
  type: "CHUNK" | "ENTITY" | "TOPIC";
  contentSnippet?: string;
  score?: number;
}

export interface EvidenceEdge {
  source: string;
  target: string;
  relation: "SUPPORTS" | "EXTENDS" | "REFERENCES" | "CO_OCCURS";
  weight: number;
}

export interface EvidenceGraph {
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
  nodeCount: number;
  edgeCount: number;
}

export class EvidenceGraphBuilder {
  public static buildGraph(chunks: VectorPayload[]): EvidenceGraph {
    const nodes: EvidenceNode[] = [];
    const edges: EvidenceEdge[] = [];
    const nodeMap = new Map<string, EvidenceNode>();

    chunks.forEach((chunk, index) => {
      const chunkId = (chunk as any).id || chunk.chunkId || `chunk-${index + 1}`;
      const text = (chunk as any).text || chunk.chunkText || "";
      const snippet = text.substring(0, 100);
      const score = (chunk as any).score ?? 0.85;

      const chunkNode: EvidenceNode = {
        id: chunkId,
        label: `Evidence Chunk ${index + 1}`,
        type: "CHUNK",
        contentSnippet: snippet,
        score,
      };

      nodeMap.set(chunkId, chunkNode);
      nodes.push(chunkNode);

      if (index > 0) {
        const prevId = (chunks[index - 1] as any).id || chunks[index - 1].chunkId || `chunk-${index}`;
        edges.push({
          source: prevId,
          target: chunkId,
          relation: "CO_OCCURS",
          weight: 0.75,
        });
      }
    });

    return {
      nodes,
      edges,
      nodeCount: nodes.length,
      edgeCount: edges.length,
    };
  }
}
