// apply-policies.mjs — applies storage RLS policies via Supabase SQL over postgres REST
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env.local manually
const envPath = resolve(__dirname, "../.env.local");
const envText = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envText
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")];
    })
);

const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];
const PROJECT_REF = SUPABASE_URL.replace("https://", "").split(".")[0];

const SQL_STATEMENTS = [
  `CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents')`,
  `CREATE POLICY "Allow authenticated reads" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents')`,
  `CREATE POLICY "Allow authenticated deletes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents')`,
];

for (const sql of SQL_STATEMENTS) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  const body = await res.json().catch(() => ({}));

  const policyName = sql.match(/"([^"]+)"/)?.[1] ?? sql.slice(0, 40);
  if (
    res.ok ||
    body?.message?.includes("already exists") ||
    body?.error?.includes("already exists")
  ) {
    console.log(`✅  "${policyName}" — applied (or already exists)`);
  } else {
    console.log(`⚠️  "${policyName}" — ${JSON.stringify(body)}`);
  }
}

console.log("\n✅  Storage policy setup complete.");
