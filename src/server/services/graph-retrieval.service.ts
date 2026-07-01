import { neo4jDriver } from "@/ai/graph/neo4j";
import { llm } from "@/ai/llm/openrouter";

export class GraphRetrievalService {
  /**
   * Performs multi-hop traversal in Neo4j to find relationship context for the user query.
   */
  static async retrieveGraphContext(query: string, organizationId: string): Promise<string> {
    if (!query.trim()) return "";

    try {
      // 1. Fast entity extraction from query
      const prompt = `
Extract up to 3 key entities (technologies, concepts, features, APIs) from the following query.
Return ONLY a comma-separated list of the entities. No extra text.

Query: "${query}"
`;
      const response = await llm.invoke(prompt);
      const entityNames = response.content.toString().split(",").map(e => e.trim());

      if (entityNames.length === 0 || entityNames[0] === "") return "";

      // 2. Query Neo4j for these entities and their 1-hop relationships
      const session = neo4jDriver.session();
      const graphContexts: string[] = [];

      try {
        await session.executeRead(async (tx) => {
          for (const entityName of entityNames) {
            // Find nodes with matching names (case-insensitive approximation) and traverse 1 hop
            const cypher = `
              MATCH (n:Entity { organizationId: $organizationId })-[r]->(m:Entity { organizationId: $organizationId })
              WHERE toLower(n.name) CONTAINS toLower($name)
              RETURN n.name AS source, type(r) AS rel, m.name AS target
              LIMIT 5
            `;
            
            const result = await tx.run(cypher, {
              organizationId,
              name: entityName
            });

            result.records.forEach(record => {
              const source = record.get("source");
              const rel = record.get("rel");
              const target = record.get("target");
              graphContexts.push(`${source} ${rel} ${target}`);
            });
          }
        });
      } finally {
        await session.close();
      }

      if (graphContexts.length === 0) return "";

      return "Graph Knowledge:\n" + graphContexts.join("\n");

    } catch (error) {
      console.error("[GraphRetrievalService] Failed to retrieve graph context:", error);
      return "";
    }
  }
}
