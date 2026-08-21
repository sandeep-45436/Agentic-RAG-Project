import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { qdrant, GLOBAL_COLLECTION_NAME } from "../src/ai/vector/qdrant";

async function main() {
  console.log("Testing Qdrant connection...");
  console.log("URL:", process.env.QDRANT_URL);
  try {
    const collections = await qdrant.getCollections();
    console.log("Collections:", collections);
    const collectionInfo = await qdrant.getCollection(GLOBAL_COLLECTION_NAME);
    console.log("Collection Info:", collectionInfo);
  } catch (err: any) {
    console.error("Qdrant connection error:", err.message || err);
  }
}

main();
