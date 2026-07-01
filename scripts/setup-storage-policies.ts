/**
 * Sets up RLS policies on the 'documents' storage bucket.
 * Run with: npx tsx scripts/setup-storage-policies.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const policies = [
  {
    name: "Allow authenticated uploads",
    sql: `CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');`,
  },
  {
    name: "Allow authenticated reads",
    sql: `CREATE POLICY "Allow authenticated reads" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');`,
  },
  {
    name: "Allow authenticated deletes",
    sql: `CREATE POLICY "Allow authenticated deletes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');`,
  },
];

async function setup() {
  console.log("🔧  Applying storage RLS policies...\n");

  for (const policy of policies) {
    // Use rpc to execute raw SQL — works with service role key
    const { error } = await admin.rpc("exec_sql" as any, { sql: policy.sql });

    if (error) {
      if (error.message?.includes("already exists")) {
        console.log(`  ✅  "${policy.name}" — already exists, skipping.`);
      } else {
        // exec_sql may not exist; fall back to direct SQL via pg endpoint
        console.log(`  ⚠️  "${policy.name}" — ${error.message}`);
        console.log(`     Apply manually in Supabase Dashboard → SQL Editor:`);
        console.log(`     ${policy.sql}\n`);
      }
    } else {
      console.log(`  ✅  "${policy.name}" — applied.`);
    }
  }

  console.log("\n✅  Done.");
}

setup();
