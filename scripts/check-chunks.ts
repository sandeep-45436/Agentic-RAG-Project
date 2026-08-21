import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const chunks = await db.chunk.findMany({
    where: { deletedAt: null },
    take: 5,
    select: {
      id: true,
      organizationId: true,
      content: true,
      document: { select: { fileName: true } }
    }
  });

  console.log(`\n=== Active Chunks Sample (${chunks.length}) ===`);
  chunks.forEach((c, i) => {
    console.log(`[${i + 1}] Org: ${c.organizationId} | Doc: ${c.document?.fileName} | Content: "${c.content.slice(0, 70)}..."`);
  });

  await db.$disconnect();
}

main().catch(console.error);
