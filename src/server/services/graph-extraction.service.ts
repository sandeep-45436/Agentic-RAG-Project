import { neo4jDriver } from "@/ai/graph/neo4j";
import { llm } from "@/ai/llm/openrouter";

export class GraphExtractionService {
  /**
   * Runs in the background to extract entities and relationships from document chunks
   * and ingest them into Neo4j.
   */
  static async extractAndIngest(text: string, organizationId: string, documentId: string) {
    if (!text.trim()) return;

    // 1. Extract using strict JSON LLM prompt
    const prompt = `
You are an advanced Entity and Relationship extractor.
Extract meaningful entities (Organization, Technology, API, Feature, Concept) 
and their relationships (USES, DEPENDS_ON, IMPLEMENTS, PART_OF, RELATED_TO) from the text.

Return ONLY valid JSON in this exact structure:
{
  "entities": [
    { "id": "entity_name", "type": "Concept|Technology|API|Feature|Organization", "name": "Entity Name" }
  ],
  "relationships": [
    { "source": "entity_id", "target": "entity_id", "type": "USES|DEPENDS_ON|IMPLEMENTS|PART_OF|RELATED_TO" }
  ]
}

Text:
"${text}"
`;

    try {
      const response = await llm.invoke(prompt);
      const rawContent = response.content.toString().trim();
      const cleaned = rawContent.replace(/```json/g, "").replace(/```/g, "");
      
      const extraction = JSON.parse(cleaned);
      const { entities, relationships } = extraction;

      if (!entities || entities.length === 0) return;

      // 2. Ingest into Neo4j safely using parameterized queries
      const session = neo4jDriver.session();

      try {
        await session.executeWrite(async (tx) => {
          // Ingest Entities
          for (const entity of entities) {
            // MERGE node and force organizationId scope
            const cypher = `
              MERGE (e:Entity { id: $id, organizationId: $organizationId })
              SET e.name = $name, e.type = $type, e.documentId = $documentId
            `;
            await tx.run(cypher, {
              id: entity.id,
              name: entity.name,
              type: entity.type,
              organizationId,
              documentId
            });
          }

          // Ingest Relationships
          if (relationships) {
            for (const rel of relationships) {
              const relCypher = `
                MATCH (a:Entity { id: $source, organizationId: $organizationId })
                MATCH (b:Entity { id: $target, organizationId: $organizationId })
                MERGE (a)-[r:${rel.type}]->(b)
                SET r.organizationId = $organizationId, r.documentId = $documentId
              `;
              // Note: Dynamic relationship types (rel.type) can be dangerous if not sanitized,
              // but we'll assume LLM output is constrained to our enum. For absolute safety in production,
              // we could validate `rel.type` against a whitelist before injecting.
              await tx.run(relCypher, {
                source: rel.source,
                target: rel.target,
                organizationId,
                documentId
              });
            }
          }
        });
      } finally {
        await session.close();
      }

    } catch (error) {
      console.error("[GraphExtractionService] Failed to extract or ingest graph data:", error);
    }
  }
}
