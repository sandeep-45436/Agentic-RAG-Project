import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { HODService } from "@/server/services/hod.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, departmentCode, departmentName, password, title, designation } = body;

    if (!name || !email || !departmentCode || !departmentName || !password) {
      return NextResponse.json(
        { error: "Name, Email, Department Code, Department Name, and Password are required." },
        { status: 400 }
      );
    }

    const regRes = await HODService.registerHOD({
      name,
      email,
      departmentCode,
      departmentName,
      password,
      title,
      designation,
    });

    if (!regRes.success || !regRes.session) {
      return NextResponse.json(
        { error: regRes.error || "Failed to register HOD." },
        { status: 400 }
      );
    }

    // Set secure session cookie
    const cookieStore = await cookies();
    cookieStore.set("hod_session", JSON.stringify(regRes.session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      session: regRes.session,
      message: `HOD account created and department ${regRes.session.departmentCode} initialized.`,
    });
  } catch (error: any) {
    console.error("[API: /api/hod/auth/signup] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during HOD registration" },
      { status: 500 }
    );
  }
}
