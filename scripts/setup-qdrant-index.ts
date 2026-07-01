import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function run() {
  console.log("🔧 Verification starting for Qdrant payload indexes...");
  try {
    const { ensureCollectionExists } = await import("../src/ai/vector/qdrant");
    await ensureCollectionExists();
    console.log("✅ Qdrant payload index verification finished successfully!");
  } catch (error) {
    console.error("❌ Failed to verify/create payload index:", error);
  }
}

run();
