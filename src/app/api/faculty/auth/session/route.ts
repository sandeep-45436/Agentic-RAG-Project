import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FacultyService } from "@/server/services/faculty.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("faculty_session");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false, faculty: null }, { status: 200 });
    }

    let parsedSession: any = null;
    try {
      parsedSession = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ authenticated: false, faculty: null }, { status: 200 });
    }

    if (!parsedSession || !parsedSession.id) {
      return NextResponse.json({ authenticated: false, faculty: null }, { status: 200 });
    }

    // Refresh profile details from DB with safe fallback
    let profile: any = null;
    try {
      profile = await FacultyService.getFacultyProfile(parsedSession.id);
    } catch (dbErr) {
      console.warn("[API: /api/faculty/auth/session] DB profile fetch fallback:", dbErr);
    }

    return NextResponse.json({
      authenticated: true,
      faculty: parsedSession,
      profile: profile || parsedSession,
    });
  } catch (error: any) {
    console.error("[API: /api/faculty/auth/session] Error:", error);
    return NextResponse.json(
      { authenticated: false, faculty: null, error: error.message || "Failed to fetch session" },
      { status: 200 }
    );
  }
}
