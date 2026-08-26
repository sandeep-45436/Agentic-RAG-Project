import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { syncUserToDatabase } from "@/server/actions/auth";
import { DocumentAccessPolicy } from "@/server/services/document-access-policy";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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

    // Prioritize university workspace organization containing documents or seed-org-001
    const preferred = memberships.find(m => m.organizationId === "seed-org-001" || m.organization._count.documents > 0) || memberships[0];
    const organizationId = preferred.organizationId;

    const { searchParams } = new URL(req.url);
    const status   = searchParams.get("status");   // COMPLETED | PROCESSING | FAILED | DELETED
    const search   = searchParams.get("search") ?? "";
    const requestedDept = searchParams.get("departmentId");
    const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10")));

    // Resolve authoritative student/faculty access context (department-scoped)
    const accessContext = await DocumentAccessPolicy.resolveStudentAccessContext(
      user.id,
      organizationId,
      requestedDept
    );

    const baseWhere = DocumentAccessPolicy.buildPrismaDocumentWhere(accessContext);

    const where: any = {
      ...baseWhere,
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
          visibility: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          createdAt: true,
          uploadedBy: true,
          knowledgeBaseId: true,
          knowledgeBase: { select: { name: true } },
          _count: { select: { chunks: { where: { deletedAt: null } } } },
        },
      }),
      db.document.count({ where }),
      db.document.aggregate({
        where,
        _sum: { fileSize: true },
      }),
    ]);

    return NextResponse.json({
      documents: docs,
      pagination: { page, pageSize, total: count, pages: Math.ceil(count / pageSize) },
      totalStorageBytes: storage._sum.fileSize ?? 0,
      scope: {
        departmentId: accessContext.departmentId,
        userRole: accessContext.userRole,
      },
    });
  } catch (error: any) {
    console.error("GET /api/documents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
