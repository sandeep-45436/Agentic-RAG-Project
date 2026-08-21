import * as path from "path";
import * as dotenv from "dotenv";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { db } from "../src/server/db/prisma";
import { appGraph } from "../src/ai/graph/workflow";

async function main() {
  const user = await db.user.findFirst({
    where: { email: "sand39727@gmail.com" },
    include: { memberships: { include: { organization: { include: { _count: { select: { documents: true } } } } } } },
  });

  if (!user) {
    console.error("User not found");
    return;
  }

  const preferred = user.memberships.find(
    (m) => m.organizationId === "seed-org-001" || m.organization._count.documents > 0
  ) || user.memberships[0];

  console.log("Resolved user organization:", preferred.organizationId, "role:", preferred.role);

  // Test 1: Extract pages 6-9 from CNIP PPT
  console.log("\n--- Testing: 'give me the CNIP ppt in that extract 6-9 pages' ---");
  const state1 = await appGraph.invoke({
    messages: [{ role: "user", content: "give me the CNIP ppt in that extract 6-9 pages" } as any],
    organizationId: preferred.organizationId,
    userId: user.id,
    userRole: preferred.role as any,
  });

  console.log("Result 1 - routedPath:", state1.routedPath);
  console.log("Result 1 - documentDelivery download URL:", state1.documentDelivery?.downloadUrl);
  console.log("Result 1 - documentDelivery pages:", state1.documentDelivery?.pages);

  // Test 2: Factual question from CNIP PPT
  console.log("\n--- Testing: 'What are the main topics in CNIP PPT?' ---");
  const state2 = await appGraph.invoke({
    messages: [{ role: "user", content: "What are the main topics in CNIP PPT?" } as any],
    organizationId: preferred.organizationId,
    userId: user.id,
    userRole: preferred.role as any,
  });

  console.log("Result 2 - routedPath:", state2.routedPath);
  console.log("Result 2 - retrieved chunks count:", state2.retrievedChunks?.length);
  console.log("Result 2 - prompt snippet:\n", state2.finalPrompt?.slice(-350));
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
