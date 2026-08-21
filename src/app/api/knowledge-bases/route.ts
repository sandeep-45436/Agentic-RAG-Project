import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { syncUserToDatabase } from "@/server/actions/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const insforge = await createClient();
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let membership = await db.membership.findFirst({ where: { userId: user.id } });
    if (!membership) {
      await syncUserToDatabase();
      membership = await db.membership.findFirst({ where: { userId: user.id } });
      if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    const knowledgeBases = await db.knowledgeBase.findMany({
      where: { organizationId: membership.organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { documents: { where: { deletedAt: null } } } },
      },
    });

    return NextResponse.json({ knowledgeBases });
  } catch (error: any) {
    console.error("GET /api/knowledge-bases error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const insforge = await createClient();
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let membership = await db.membership.findFirst({ where: { userId: user.id } });
    if (!membership) {
      await syncUserToDatabase();
      membership = await db.membership.findFirst({ where: { userId: user.id } });
      if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    const { name, description } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const kb = await db.knowledgeBase.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        organizationId: membership.organizationId,
      },
    });

    return NextResponse.json({ knowledgeBase: kb }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/knowledge-bases error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
