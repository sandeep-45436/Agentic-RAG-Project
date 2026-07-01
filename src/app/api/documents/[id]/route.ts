import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(
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

    const doc = await db.document.findFirst({
      where: { id, organizationId: membership.organizationId },
      include: {
        knowledgeBase: { select: { name: true } },
        _count: { select: { chunks: { where: { deletedAt: null } } } },
        chunks: {
          where: { deletedAt: null },
          take: 5,
          orderBy: { chunkIndex: "asc" },
          select: { id: true, content: true, chunkIndex: true, tokenCount: true },
        },
      },
    });

    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Build a signed URL for the storage object
    const { data: signedUrlData } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.storagePath, 3600); // 1h

    return NextResponse.json({
      document: { ...doc, signedUrl: signedUrlData?.signedUrl ?? null },
    });
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await db.membership.findFirst({ where: { userId: user.id } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 403 });

    const doc = await db.document.findFirst({
      where: { id, organizationId: membership.organizationId, deletedAt: null },
    });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    await db.document.update({ where: { id }, data: { deletedAt: new Date() } });
    await supabase.storage.from("documents").remove([doc.storagePath]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/documents/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
