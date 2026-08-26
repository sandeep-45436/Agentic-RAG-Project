import { neo4jDriver } from "@/ai/graph/neo4j";
import { llm } from "@/ai/llm/openrouter";

export class GraphRetrievalService {
  /**
   * Performs multi-hop traversal in Neo4j to find relationship context for the user query.
   */
  static async retrieveGraphContext(
    query: string,
    organizationId: string,
    preComputedEntities?: string[],
    departmentId?: string | null
  ): Promise<string> {
    if (!query.trim()) return "";

    try {
      let entityNames: string[] = [];

      if (preComputedEntities && preComputedEntities.length > 0) {
        entityNames = preComputedEntities;
      } else {
        // 1. Fast entity extraction from query
        const prompt = `
Extract up to 3 key entities (technologies, concepts, features, APIs) from the following query.
Return ONLY a comma-separated list of the entities. No extra text.

Query: "${query}"
`;
        const response = await llm.invoke(prompt);
        entityNames = response.content.toString().split(",").map(e => e.trim());
      }

      if (entityNames.length === 0 || entityNames[0] === "") return "";

      // 2. Query Neo4j for these entities and their 1-hop relationships with department scoping
      const session = neo4jDriver.session();
      const graphContexts: string[] = [];

      try {
        await session.executeRead(async (tx) => {
          // Cypher query enforcing organizationId and department / university visibility scoping
          const cypher = `
            MATCH (n:Entity { organizationId: $organizationId })-[r]->(m:Entity { organizationId: $organizationId })
            WHERE toLower(n.name) CONTAINS toLower($name)
              AND (
                $departmentId IS NULL 
                OR n.departmentId IS NULL 
                OR n.departmentId = $departmentId 
                OR n.visibility = 'UNIVERSITY'
              )
              AND (
                $departmentId IS NULL 
                OR m.departmentId IS NULL 
                OR m.departmentId = $departmentId 
                OR m.visibility = 'UNIVERSITY'
              )
            RETURN n.name AS source, type(r) AS rel, m.name AS target
            LIMIT 5
          `;

          const entityQueries = entityNames.map(async (entityName) => {
            const result = await tx.run(cypher, {
              organizationId,
              departmentId: departmentId || null,
              name: entityName,
            });
            return result.records.map((record) => {
              const source = record.get("source");
              const rel = record.get("rel");
              const target = record.get("target");
              return `${source} ${rel} ${target}`;
            });
          });

          const results = await Promise.all(entityQueries);
          results.forEach((triples) => graphContexts.push(...triples));
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
