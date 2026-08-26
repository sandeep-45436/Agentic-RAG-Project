import { createServerClient, createAuthActions } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import dns from "node:dns";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}

const DEFAULT_INSFORGE_URL = "https://3g428aji.ap-southeast.insforge.app";
const DEFAULT_INSFORGE_ANON_KEY = "anon_a02244bc085b5c7fbe0c8d30a535a015d76c1bd236a3c65deef304e60273e113";

export async function createClient() {
  let cookieStore: any = null;
  try {
    cookieStore = await cookies();
  } catch {}

  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || DEFAULT_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || DEFAULT_INSFORGE_ANON_KEY;
  
  return createServerClient({
    baseUrl,
    anonKey,
    cookies: {
      get(name: string) {
        return cookieStore?.get(name)?.value;
      }
    }
  });
}

export async function createAuthClient() {
  let cookieStore: any = null;
  try {
    cookieStore = await cookies();
  } catch {}

  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || DEFAULT_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || DEFAULT_INSFORGE_ANON_KEY;
  
  return createAuthActions({
    baseUrl,
    anonKey,
    cookies: cookieStore as any
  });
}
