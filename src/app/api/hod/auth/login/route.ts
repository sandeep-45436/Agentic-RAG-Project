import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { HODService } from "@/server/services/hod.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "HOD ID/Email and Password are required." },
        { status: 400 }
      );
    }

    const authRes = await HODService.authenticateHOD(identifier, password);

    if (!authRes.success || !authRes.session) {
      return NextResponse.json(
        { error: authRes.error || "Invalid HOD / Dean credentials." },
        { status: 401 }
      );
    }

    // Set secure cookie for HOD session
    const cookieStore = await cookies();
    cookieStore.set("hod_session", JSON.stringify(authRes.session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      session: authRes.session,
    });
  } catch (error: any) {
    console.error("[API: /api/hod/auth/login] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
