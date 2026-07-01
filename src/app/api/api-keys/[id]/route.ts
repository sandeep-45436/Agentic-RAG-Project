import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await db.membership.findFirst({ where: { userId: user.id } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 403 });

    const key = await db.apiKey.findFirst({
      where: { id, organizationId: membership.organizationId, deletedAt: null },
    });
    if (!key) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.apiKey.update({ where: { id }, data: { deletedAt: new Date() } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
