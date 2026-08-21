import { createBrowserClient } from "@insforge/sdk/ssr";

export function createClient() {
  return createBrowserClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
  });
}
