import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FacultyService } from "@/server/services/faculty.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Faculty ID/Email and Password are required." },
        { status: 400 }
      );
    }

    const authRes = await FacultyService.authenticateFaculty(identifier, password);

    if (!authRes.success || !authRes.faculty) {
      return NextResponse.json(
        { error: authRes.error || "Invalid faculty credentials." },
        { status: 401 }
      );
    }

    // Set secure cookie for faculty session
    const cookieStore = await cookies();
    cookieStore.set("faculty_session", JSON.stringify(authRes.faculty), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      faculty: authRes.faculty,
    });
  } catch (error: any) {
    console.error("[API: /api/faculty/auth/login] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
