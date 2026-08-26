import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@insforge/sdk/ssr/middleware";
import { RateLimiter } from "@/server/services/rate-limit";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Rate limiting for heavy endpoints
  if (path.startsWith("/api/chat") || path.startsWith("/api/documents/upload")) {
    const ip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "anonymous";
    const { success } = await RateLimiter.checkLimit(ip, "api", 10, 60);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  let response = NextResponse.next({ request });

  const requestCookies = {
    get: (name: string) => request.cookies.get(name)?.value,
    set: (name: string, value: string, options: any) => {
      request.cookies.set({ name, value, ...options });
    },
    delete: (name: string) => { request.cookies.delete(name); },
  };

  const responseCookies = {
    get: (name: string) => response.cookies.get(name)?.value,
    set: (name: string, value: string, options: any) => {
      request.cookies.set({ name, value, ...options });
      response = NextResponse.next({ request });
      response.cookies.set({ name, value, ...options });
    },
    delete: (name: string, options: any) => {
      request.cookies.delete(name);
      response = NextResponse.next({ request });
      response.cookies.delete(name);
    },
  };

  let result: { accessToken?: string | null } = { accessToken: null };
  try {
    result = await updateSession({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
      requestCookies: requestCookies as any,
      responseCookies: responseCookies as any,
    });
  } catch (netErr) {
    console.warn("[Middleware] updateSession network fetch failed (ignoring transient failure):", netErr);
  }

  const hasSession = !!result.accessToken;
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/signup");
  const isPublicRoute = path === "/" || path === "/pricing";

  // Dedicated HOD Portal Route Protection
  if (path.startsWith("/hod")) {
    const hasHodSession = !!request.cookies.get("hod_session")?.value;
    const isHodAuthRoute = path === "/hod/login" || path === "/hod/signup" || path.startsWith("/hod/auth");

    if (!hasHodSession && !isHodAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/hod/login";
      return NextResponse.redirect(url);
    }

    if (hasHodSession && isHodAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/hod/dashboard";
      return NextResponse.redirect(url);
    }

    return response;
  }

  // Dedicated Faculty Portal Route Protection
  if (path.startsWith("/faculty")) {
    const hasFacultySession = !!request.cookies.get("faculty_session")?.value;
    const isFacultyAuthRoute = path === "/faculty/login";

    if (!hasFacultySession && !isFacultyAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/faculty/login";
      return NextResponse.redirect(url);
    }

    if (hasFacultySession && isFacultyAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/faculty/dashboard";
      return NextResponse.redirect(url);
    }

    return response;
  }

  // Main Student / General Portal Route Protection
  if (!hasSession && !isAuthRoute && !isPublicRoute && !path.startsWith("/auth") && !path.startsWith("/api")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/refresh|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
