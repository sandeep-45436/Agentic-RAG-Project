import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { AuditService } from "@/server/services/audit";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
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

    const key = await db.apiKey.findFirst({
      where: { id, organizationId: membership.organizationId, deletedAt: null },
    });
    if (!key) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.apiKey.update({ where: { id }, data: { deletedAt: new Date() } });

    // Log the API key deletion event
    const userAgent = req.headers.get("user-agent");
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;

    await AuditService.logEvent({
      orgId: membership.organizationId,
      userId: user.id,
      action: "API_KEY_DELETED",
      ip,
      userAgent,
      metadata: {
        keyId: id,
        name: key.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
