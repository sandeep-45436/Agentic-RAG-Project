import { createClient } from "@/utils/supabase/server";
import { db } from "@/server/db/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { feedback } = await req.json();

    if (feedback !== "thumbs_up" && feedback !== "thumbs_down" && feedback !== null) {
      return NextResponse.json({ error: "Invalid feedback value" }, { status: 400 });
    }

    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch user's organization membership
    const membership = await db.membership.findFirst({
      where: { userId: user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden - No active membership found" }, { status: 403 });
    }

    // 3. Find message and verify organization boundary
    const message = await db.message.findFirst({
      where: {
        id,
        organizationId: membership.organizationId,
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found or access denied" }, { status: 404 });
    }

    // 4. Update the message metadata with feedback
    const currentMetadata = message.metadata ? (typeof message.metadata === "string" ? JSON.parse(message.metadata) : message.metadata) : {};
    const updatedMetadata = {
      ...(typeof currentMetadata === "object" ? currentMetadata : {}),
      feedback,
    };

    await db.message.update({
      where: { id },
      data: {
        metadata: updatedMetadata,
      },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error: any) {
    console.error("[POST /api/messages/[id]/feedback] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
