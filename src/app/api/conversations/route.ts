import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { ConversationService } from "@/server/services/conversation.service";
import { syncUserToDatabase } from "@/server/actions/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const insforge = await createClient();
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let memberships = await db.membership.findMany({
      where: { userId: user.id },
      include: { organization: { include: { _count: { select: { documents: true } } } } },
    });

    if (memberships.length === 0) {
      await syncUserToDatabase();
      memberships = await db.membership.findMany({
        where: { userId: user.id },
        include: { organization: { include: { _count: { select: { documents: true } } } } },
      });
    }

    if (memberships.length === 0) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    const preferred = memberships.find(m => m.organizationId === "seed-org-001" || m.organization._count.documents > 0) || memberships[0];
    const organizationId = preferred.organizationId;

    const conversations = await ConversationService.getConversations(
      user.id,
      organizationId
    );

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error("GET /api/conversations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const insforge = await createClient();
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let memberships = await db.membership.findMany({
      where: { userId: user.id },
      include: { organization: { include: { _count: { select: { documents: true } } } } },
    });

    if (memberships.length === 0) {
      await syncUserToDatabase();
      memberships = await db.membership.findMany({
        where: { userId: user.id },
        include: { organization: { include: { _count: { select: { documents: true } } } } },
      });
    }

    if (memberships.length === 0) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    const preferred = memberships.find(m => m.organizationId === "seed-org-001" || m.organization._count.documents > 0) || memberships[0];
    const organizationId = preferred.organizationId;

    const { title } = await req.json().catch(() => ({}));

    const conversation = await ConversationService.createConversation(
      user.id,
      organizationId,
      title
    );

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/conversations error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
