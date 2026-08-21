import { NextResponse } from "next/server";
import { createAuthClient } from "@/utils/insforge/server";
import { syncUserToDatabase } from "@/server/actions/auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code =
    requestUrl.searchParams.get("code") ||
    requestUrl.searchParams.get("insforge_code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const authClient = await createAuthClient();
    const { error } = await authClient.exchangeOAuthCode(code);

    if (!error) {
      await syncUserToDatabase();
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=Could not authenticate user", request.url)
  );
}
