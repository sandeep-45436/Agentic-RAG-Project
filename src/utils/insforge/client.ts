import { createBrowserClient } from "@insforge/sdk/ssr";

const DEFAULT_INSFORGE_URL = "https://3g428aji.ap-southeast.insforge.app";
const DEFAULT_INSFORGE_ANON_KEY = "anon_a02244bc085b5c7fbe0c8d30a535a015d76c1bd236a3c65deef304e60273e113";

export function createClient() {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || DEFAULT_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || DEFAULT_INSFORGE_ANON_KEY;

  return createBrowserClient({
    baseUrl,
    anonKey,
  });
}
