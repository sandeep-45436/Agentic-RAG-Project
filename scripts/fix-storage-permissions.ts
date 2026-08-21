import { db } from "@/server/db/prisma";

async function main() {
  console.log("=== CREATING DOCUMENT-EXTRACTS BUCKET IN POSTGRES ===");

  try {
    await db.$executeRawUnsafe(`
      INSERT INTO storage.buckets (name, public, created_at, updated_at)
      VALUES ('document-extracts', false, NOW(), NOW())
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log("✓ Bucket 'document-extracts' created/verified successfully!");

    const buckets: any = await db.$queryRawUnsafe(`SELECT name, public FROM storage.buckets;`);
    console.log("=== ALL BUCKETS IN DB ===");
    console.log(JSON.stringify(buckets, null, 2));
  } catch (err: any) {
    console.error("Error creating bucket:", err?.message || err);
  }
}

main()
  .catch((e) => console.error("Error:", e))
  .finally(() => process.exit(0));
