import { QdrantClient } from "@qdrant/js-client-rest";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function getQdrantConfig() {
  let url = process.env.QDRANT_URL || "";
  let port: number | undefined = undefined;
  
  if (url.includes(":6333")) {
    url = url.replace(":6333", "");
    port = 6333;
  } else if (url.includes("cloud.qdrant.io")) {
    port = 6333;
  }

  return {
    url: url || undefined,
    port: port || 6333,
    apiKey: process.env.QDRANT_API_KEY,
    checkCompatibility: false,
  };
}

export const qdrant = new QdrantClient(getQdrantConfig());

export const GLOBAL_COLLECTION_NAME = "document_chunks";

export async function resetCollection() {
  try {
    const result = await qdrant.getCollections();
    const exists = result.collections.some((c) => c.name === GLOBAL_COLLECTION_NAME);
    if (exists) {
      console.log(`🗑️ Deleting existing Qdrant collection '${GLOBAL_COLLECTION_NAME}'...`);
      await qdrant.deleteCollection(GLOBAL_COLLECTION_NAME);
    }
    await ensureCollectionExists();
    console.log(`✅ Qdrant collection '${GLOBAL_COLLECTION_NAME}' cleanly reset and initialized.`);
  } catch (error) {
    console.error("Failed to reset Qdrant collection:", error);
    throw error;
  }
}

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

    // Ensure payload indexes exist for filtered fields
    const indexesToCreate: Array<{ name: string; schema: "keyword" | "bool" }> = [
      { name: "organizationId", schema: "keyword" },
      { name: "isLatest", schema: "bool" },
      { name: "documentId", schema: "keyword" },
      { name: "knowledgeBaseId", schema: "keyword" },
    ];

    for (const idx of indexesToCreate) {
      try {
        await qdrant.createPayloadIndex(GLOBAL_COLLECTION_NAME, {
          field_name: idx.name,
          field_schema: idx.schema,
        });
        console.log(`✅ Qdrant payload index for ${idx.name} (${idx.schema}) verified/created.`);
      } catch (indexError) {
        // Payload index already exists or non-fatal
      }
    }
  } catch (error) {
    console.error("Failed to ensure collection exists:", error);
    throw error;
  }
}
