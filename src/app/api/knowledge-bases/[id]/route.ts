import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

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

    const kb = await db.knowledgeBase.findFirst({
      where: { id, organizationId: membership.organizationId, deletedAt: null },
    });
    if (!kb) return NextResponse.json({ error: "Knowledge base not found" }, { status: 404 });

    await db.knowledgeBase.update({ where: { id }, data: { deletedAt: new Date() } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/knowledge-bases/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
