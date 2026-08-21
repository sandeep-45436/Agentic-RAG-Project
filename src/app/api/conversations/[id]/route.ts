import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { ConversationService } from "@/server/services/conversation.service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const insforge = await createClient();
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await db.membership.findFirst({ where: { userId: user.id } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 403 });

    const conversation = await ConversationService.getConversation(id, membership.organizationId);
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ conversation });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const insforge = await createClient();
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await db.membership.findFirst({ where: { userId: user.id } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 403 });

    await ConversationService.deleteConversation(id, membership.organizationId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
