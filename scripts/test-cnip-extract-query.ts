import * as path from "path";
import * as dotenv from "dotenv";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { db } from "../src/server/db/prisma";
import { appGraph } from "../src/ai/graph/workflow";
import { DocumentDeliveryTool } from "../src/ai/tools/document-delivery.tool";
import { DocumentAccessControl } from "../src/ai/documents/document-access-control";

async function main() {
  console.log("=== DIAGNOSING CNIP PPT EXTRACTION QUERY ===");

  const doc = await db.document.findFirst({
    where: { fileName: { contains: "CNIP", mode: "insensitive" } },
  });
  console.log("1. CNIP Document in DB:", doc);

  if (!doc) {
    console.error("❌ CNIP Document NOT found in DB!");
    return;
  }

  const users = await db.user.findMany({ include: { memberships: true } });
  console.log("\n2. Users in DB:");
  users.forEach((u) =>
    console.log(`  - ${u.email} (${u.id}) -> Role: ${u.memberships[0]?.role}, Org: ${u.memberships[0]?.organizationId}`)
  );

  // Let's test as MEMBER role
  const studentUser = users.find((u) => u.memberships[0]?.role === "MEMBER") || users[0];
  const orgId = doc.organizationId;
  console.log(`\n3. Testing Access Check with User: ${studentUser.email} (${studentUser.id}) Role: ${studentUser.memberships[0]?.role || "MEMBER"}...`);

  const access = await DocumentAccessControl.checkAccess({
    userId: studentUser.id,
    userRole: (studentUser.memberships[0]?.role as any) || "MEMBER",
    organizationId: orgId,
    documentId: doc.id,
  });
  console.log("   Access Result:", access);

  console.log("\n4. Testing Direct DocumentDeliveryTool execution for 'give me the CNIP ppt in that extract 6-9 pages'...");
  const toolResult = await DocumentDeliveryTool.execute({
    operation: "GET_PAGES",
    query: "give me the CNIP ppt in that extract 6-9 pages",
    pages: [6, 7, 8, 9],
    organizationId: orgId,
    userId: studentUser.id,
    userRole: (studentUser.memberships[0]?.role as any) || "MEMBER",
  });
  console.log("   Tool Result:", JSON.stringify(toolResult, null, 2));

  console.log("\n5. Testing Full appGraph.invoke...");
  const state = await appGraph.invoke({
    messages: [
      {
        role: "user",
        content: "give me the CNIP ppt in that extract 6-9 pages",
      } as any,
    ],
    organizationId: orgId,
    userId: studentUser.id,
    userRole: (studentUser.memberships[0]?.role as any) || "MEMBER",
  });

  console.log("\n--- Full Graph State ---");
  console.log("routedPath:", state.routedPath);
  console.log("documentDelivery:", state.documentDelivery);
  console.log("\nFinal Prompt:\n", state.finalPrompt);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
