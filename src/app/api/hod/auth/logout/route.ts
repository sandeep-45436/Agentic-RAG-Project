import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("hod_session");

    return NextResponse.json({
      success: true,
      message: "HOD signed out successfully.",
    });
  } catch (error: any) {
    console.error("[API: /api/hod/auth/logout] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to logout" },
      { status: 500 }
    );
  }
}
