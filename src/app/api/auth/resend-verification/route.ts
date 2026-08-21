import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const insforge = await createClient();
    const { error } = await (insforge.auth as any).resendVerificationEmail({ email });

    if (error) {
      return NextResponse.json({ error: error.message || "Failed to resend code" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[resend-verification] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
