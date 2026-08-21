import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FacultyService } from "@/server/services/faculty.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("faculty_session");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let parsedSession: any;
    try {
      parsedSession = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Refresh profile details from DB
    const profile = await FacultyService.getFacultyProfile(parsedSession.id);
    if (!profile) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      faculty: parsedSession,
      profile,
    });
  } catch (error: any) {
    console.error("[API: /api/faculty/auth/session] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch session" },
      { status: 500 }
    );
  }
}
