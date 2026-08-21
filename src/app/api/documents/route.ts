import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { syncUserToDatabase } from "@/server/actions/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const insforge = await createClient();
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let membership = null;
    try {
      membership = await db.membership.findFirst({ where: { userId: user.id } });
    } catch (connErr) {
      console.warn("[GET /api/documents] Retrying membership lookup after connection retry...", connErr);
      await new Promise((r) => setTimeout(r, 400));
      membership = await db.membership.findFirst({ where: { userId: user.id } });
    }

    if (!membership) {
      await syncUserToDatabase();
      membership = await db.membership.findFirst({ where: { userId: user.id } });
      if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status   = searchParams.get("status");   // COMPLETED | PROCESSING | FAILED | DELETED
    const search   = searchParams.get("search") ?? "";
    const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10")));

    const where: any = {
      organizationId: membership.organizationId,
      ...(status === "DELETED"
        ? { deletedAt: { not: null } }
        : { deletedAt: null }),
    };

    if (status && status !== "DELETED") {
      where.processingStatus = status;
    }
    if (search) {
      where.fileName = { contains: search, mode: "insensitive" };
    }

    let documents = [];
    let total = 0;
    let totalStorageBytes = 0;

    try {
      const [docs, count, storage] = await Promise.all([
        db.document.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            fileType: true,
            processingStatus: true,
            createdAt: true,
            uploadedBy: true,
            knowledgeBaseId: true,
            knowledgeBase: { select: { name: true } },
            _count: { select: { chunks: { where: { deletedAt: null } } } },
          },
        }),
        db.document.count({ where }),
        db.document.aggregate({
          where: { organizationId: membership.organizationId, deletedAt: null },
          _sum: { fileSize: true },
        }),
      ]);
      documents = docs;
      total = count;
      totalStorageBytes = storage._sum.fileSize ?? 0;
    } catch (dbErr) {
      console.warn("[GET /api/documents] Query failed, executing sequential fallback retry...", dbErr);
      await new Promise((r) => setTimeout(r, 400));
      documents = await db.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          fileType: true,
          processingStatus: true,
          createdAt: true,
          uploadedBy: true,
          knowledgeBaseId: true,
          knowledgeBase: { select: { name: true } },
          _count: { select: { chunks: { where: { deletedAt: null } } } },
        },
      });
      total = await db.document.count({ where });
      const storage = await db.document.aggregate({
        where: { organizationId: membership.organizationId, deletedAt: null },
        _sum: { fileSize: true },
      });
      totalStorageBytes = storage._sum.fileSize ?? 0;
    }

    return NextResponse.json({
      documents,
      pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
      totalStorageBytes,
    });
  } catch (error: any) {
    console.error("GET /api/documents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
