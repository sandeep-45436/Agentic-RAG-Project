import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const SRC = "./src";

function walk(dir) {
  const entries = [];
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    if (statSync(full).isDirectory()) entries.push(...walk(full));
    else if (f.endsWith(".ts") || f.endsWith(".tsx")) entries.push(full);
  }
  return entries;
}

let fixed = 0;
for (const file of walk(SRC)) {
  let content = readFileSync(file, "utf8");
  const orig = content;

  // Restore insforge server imports
  content = content.replace(/from "@\/utils\/supabase\/server"/g, 'from "@/utils/insforge/server"');
  content = content.replace(/from '@\/utils\/supabase\/server'/g, "from '@/utils/insforge/server'");

  // Restore insforge client imports
  content = content.replace(/from "@\/utils\/supabase\/client"/g, 'from "@/utils/insforge/client"');
  content = content.replace(/from '@\/utils\/supabase\/client'/g, "from '@/utils/insforge/client'");

  // Restore supabase. → insforge. (variable name in code bodies)
  content = content.replace(/\bconst supabase = await createClient\(\)/g, "const insforge = await createClient()");
  content = content.replace(/\bconst supabase = createClient\(\)/g, "const insforge = createClient()");

  // Restore supabase.auth.getUser() → insforge.auth.getCurrentUser() pattern
  content = content.replace(
    /const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\);/g,
    "const { data: userData, error: userError } = await insforge.auth.getCurrentUser();\n    const user = userData?.user;"
  );

  // Restore supabase. → insforge.
  content = content.replace(/\bsupabase\.(auth|storage|from)\b/g, "insforge.$1");

  if (content !== orig) {
    writeFileSync(file, content, "utf8");
    fixed++;
    console.log("Restored:", file.replace(SRC, "src"));
  }
}
console.log(`\nTotal restored: ${fixed} files`);
