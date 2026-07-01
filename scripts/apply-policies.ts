import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

const policies = [
  `CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents')`,
  `CREATE POLICY "Allow authenticated reads" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents')`,
  `CREATE POLICY "Allow authenticated deletes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents')`,
];

async function run() {
  console.log("🔧  Applying storage RLS policies via Postgres...\n");

  for (const sql of policies) {
    const policyName = sql.match(/"([^"]+)"/)?.[1] ?? sql.slice(0, 50);
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`  ✅  "${policyName}" — applied.`);
    } catch (e: any) {
      if (e.message?.includes("already exists")) {
        console.log(`  ✅  "${policyName}" — already exists, skipping.`);
      } else {
        console.log(`  ❌  "${policyName}" — ${e.message}`);
      }
    }
  }

  await prisma.$disconnect();
  console.log("\n✅  Done.");
}

run();
