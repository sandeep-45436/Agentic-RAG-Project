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

  // Fix variable names: insforge → supabase
  content = content.replace(/\bconst insforge = await createClient\(\)/g, "const supabase = await createClient()");
  content = content.replace(/\bconst insforge = createClient\(\)/g, "const supabase = createClient()");

  // Fix InsForge auth pattern → Supabase auth pattern
  // const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
  // const user = userData?.user;
  content = content.replace(
    /const \{ data: userData, error: userError \} = await (insforge|supabase)\.auth\.getCurrentUser\(\);\s*\n(\s*)const user = userData\?\.user;/g,
    (_, _client, indent) => `const { data: { user } } = await supabase.auth.getUser();`
  );

  // Fix server-side: const { data, error } = await insforge.auth.getCurrentUser();
  // const user = data?.user;
  content = content.replace(
    /const \{ data, error \} = await (insforge|supabase)\.auth\.getCurrentUser\(\);\s*\n(\s*)const user = data\?\.user;/g,
    (_) => `const { data: { user } } = await supabase.auth.getUser();`
  );

  // Fix client-side: insforge.auth.getCurrentUser().then(({ data, error }) => {
  content = content.replace(
    /insforge\.auth\.getCurrentUser\(\)\.then\(\(\{ data, error \}\) =>/g,
    "supabase.auth.getUser().then(({ data: { user: _u }, error }) =>"
  );

  // Fix remaining insforge. → supabase.
  content = content.replace(/\binsforge\./g, "supabase.");

  if (content !== orig) {
    writeFileSync(file, content, "utf8");
    fixed++;
    console.log("Fixed:", file.replace(SRC, "src"));
  }
}
console.log(`\nTotal fixed: ${fixed} files`);
