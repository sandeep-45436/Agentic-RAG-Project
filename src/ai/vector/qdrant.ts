import { QdrantClient } from "@qdrant/js-client-rest";

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

export const GLOBAL_COLLECTION_NAME = "document_chunks";

export async function ensureCollectionExists() {
  try {
    const result = await qdrant.getCollections();
    const exists = result.collections.some((c) => c.name === GLOBAL_COLLECTION_NAME);

    if (!exists) {
      await qdrant.createCollection(GLOBAL_COLLECTION_NAME, {
        vectors: {
          size: 1536,
          distance: "Cosine",
        },
      });
    }

    // Ensure payload index for organizationId exists
    try {
      await qdrant.createPayloadIndex(GLOBAL_COLLECTION_NAME, {
        field_name: "organizationId",
        field_schema: "keyword",
      });
      console.log("✅ Qdrant payload index for organizationId verified/created.");
    } catch (indexError) {
      console.log("Payload index for organizationId already exists or failed to create:", indexError);
    }
  } catch (error) {
    console.error("Failed to ensure collection exists:", error);
    throw error;
  }
}
