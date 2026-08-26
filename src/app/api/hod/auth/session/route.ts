import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("hod_session");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false, session: null }, { status: 200 });
    }

    let parsedSession: any = null;
    try {
      parsedSession = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ authenticated: false, session: null }, { status: 200 });
    }

    if (!parsedSession || !parsedSession.id) {
      return NextResponse.json({ authenticated: false, session: null }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      session: parsedSession,
    });
  } catch (error: any) {
    console.error("[API: /api/hod/auth/session] Error:", error);
    return NextResponse.json(
      { authenticated: false, session: null, error: error.message || "Failed to fetch session" },
      { status: 200 }
    );
  }
}
