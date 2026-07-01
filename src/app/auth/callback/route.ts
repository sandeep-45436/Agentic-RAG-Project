import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { syncUserToDatabase } from "@/server/actions/auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Upon successful login/signup, sync the user to Prisma
      await syncUserToDatabase();
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL("/login?error=Could not authenticate user", request.url));
}
