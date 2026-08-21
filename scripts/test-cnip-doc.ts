import { db } from "@/server/db/prisma";

async function main() {
  const docs = await db.document.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      fileName: true,
      organizationId: true,
      knowledgeBaseId: true,
      storagePath: true,
      createdAt: true,
    },
  });

  console.log("=== DB DOCUMENTS ===");
  console.log(`Total active documents in DB: ${docs.length}`);
  console.log(JSON.stringify(docs, null, 2));

  const kbs = await db.knowledgeBase.findMany({
    select: { id: true, name: true, organizationId: true },
  });
  console.log("=== KNOWLEDGE BASES ===");
  console.log(JSON.stringify(kbs, null, 2));
}

main()
  .catch((e) => console.error("Error:", e))
  .finally(() => process.exit(0));
