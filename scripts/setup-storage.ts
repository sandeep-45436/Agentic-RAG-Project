/**
 * One-time setup script: creates the 'documents' Supabase Storage bucket.
 * Run with: npx tsx scripts/setup-storage.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Get it from: Supabase Dashboard → Project Settings → API → service_role key
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local\n" +
    "    Get your service_role key from: Supabase Dashboard → Project Settings → API"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function setup() {
  console.log("🔧  Setting up Supabase Storage...");

  // Create 'documents' bucket
  const { data, error } = await supabase.storage.createBucket("documents", {
    public: false,
    allowedMimeTypes: ["application/pdf"],
    fileSizeLimit: 10 * 1024 * 1024, // 10 MB
  });

  if (error) {
    if (error.message.includes("already exists") || error.message.includes("Duplicate")) {
      console.log("✅  Bucket 'documents' already exists — nothing to do.");
    } else {
      console.error("❌  Failed to create bucket:", error.message);
      process.exit(1);
    }
  } else {
    console.log("✅  Bucket 'documents' created successfully.");
  }

  // Set RLS policy: authenticated users can read/write only their org's folder
  // (This is done via Supabase Dashboard → Storage → Policies, or via SQL migrations)
  console.log("\n📋  Next steps:");
  console.log("    1. Go to Supabase Dashboard → Storage → documents → Policies");
  console.log("    2. Add a policy: authenticated users can INSERT/SELECT/DELETE");
  console.log("       where (storage.foldername(name))[1] = auth.uid()::text");
  console.log("\n✅  Storage setup complete.");
}

setup();
