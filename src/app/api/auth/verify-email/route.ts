import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!;

    // Call InsForge server-to-server (no CORS, no token needed for verify)
    const insforgeRes = await fetch(`${insforgeUrl}/api/auth/email/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Pass anonKey without Bearer prefix — InsForge may expect it as apiKey
        "x-api-key": anonKey,
        "apikey": anonKey,
      },
      body: JSON.stringify({ email, otp }),
    });

    let responseBody: any;
    try {
      responseBody = await insforgeRes.json();
    } catch {
      responseBody = {};
    }

    if (!insforgeRes.ok) {
      console.error("[verify-email] InsForge error:", insforgeRes.status, responseBody);
      return NextResponse.json(
        { error: responseBody?.message || responseBody?.error || "Invalid or expired code" },
        { status: insforgeRes.status }
      );
    }

    // Build response — forward any Set-Cookie headers from InsForge
    const response = NextResponse.json({ success: true, data: responseBody });

    const rawSetCookie = insforgeRes.headers.get("set-cookie");
    if (rawSetCookie) {
      response.headers.append("set-cookie", rawSetCookie);
    }

    // Also store accessToken/refreshToken as cookies if returned in body
    if (responseBody?.accessToken) {
      response.cookies.set("access_token", responseBody.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60, // 1 hour
      });
    }
    if (responseBody?.refreshToken) {
      response.cookies.set("refresh_token", responseBody.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (err: any) {
    console.error("[verify-email] Unexpected error:", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
