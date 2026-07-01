import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { RateLimiter } from "@/server/services/rate-limit";

export async function proxy(request: NextRequest) {
  // Rate limiting logic for protected routes
  const path = request.nextUrl.pathname;
  
  if (path.startsWith("/api/chat") || path.startsWith("/api/documents/upload")) {
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "anonymous";
    
    // Example Limits: 10 requests per 60 seconds per IP
    const { success } = await RateLimiter.checkLimit(ip, "api", 10, 60);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
