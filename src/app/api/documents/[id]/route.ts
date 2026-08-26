import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const facultyCookie = cookieStore.get("faculty_session");

    let isFaculty = false;
    let facultyUser: any = null;
    if (facultyCookie?.value) {
      try {
        facultyUser = JSON.parse(facultyCookie.value);
        isFaculty = Boolean(facultyUser);
      } catch {}
    }

    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData?.user;

    if (!user && !isFaculty) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up document in database
    const doc = await db.document.findFirst({
      where: { id, deletedAt: null },
      include: {
        department: { select: { id: true, code: true, name: true } },
        college: { select: { id: true, code: true, name: true } },
        knowledgeBase: { select: { id: true, name: true } },
        _count: { select: { chunks: { where: { deletedAt: null } } } },
        chunks: {
          where: { deletedAt: null },
          take: 10,
          orderBy: { chunkIndex: "asc" },
          select: { id: true, content: true, chunkIndex: true, tokenCount: true, pageNumber: true },
        },
      },
    });

    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    // Build a signed URL for the storage object if storagePath exists
    let signedUrl: string | null = null;
    try {
      if (doc.storagePath) {
        const { data: signedUrlData } = await insforge.storage
          .from("documents")
          .createSignedUrl(doc.storagePath, 3600);
        signedUrl = signedUrlData?.signedUrl ?? null;
      }
    } catch (storageErr) {
      console.warn("[GET /api/documents/[id]] Signed URL generation skipped:", storageErr);
    }

    return NextResponse.json({
      document: {
        ...doc,
        signedUrl,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/documents/[id]] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const facultyCookie = cookieStore.get("faculty_session");

    let isFaculty = false;
    let facultyUser: any = null;
    if (facultyCookie?.value) {
      try {
        facultyUser = JSON.parse(facultyCookie.value);
        isFaculty = Boolean(facultyUser);
      } catch {}
    }

    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData?.user;

    if (!user && !isFaculty) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doc = await db.document.findFirst({
      where: { id, deletedAt: null },
    });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    await db.document.update({ where: { id }, data: { deletedAt: new Date() } });

    try {
      if (doc.storagePath) {
        await insforge.storage.from("documents").remove(doc.storagePath);
      }
    } catch {}

    return NextResponse.json({ success: true, message: "Document deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/documents/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
