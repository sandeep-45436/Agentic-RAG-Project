import { NextResponse } from "next/server";
import { db } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentCode = searchParams.get("department") || "CS";
    const visibility = searchParams.get("visibility"); // PRIVATE, FACULTY, DEPARTMENT, COLLEGE, UNIVERSITY
    const isAll = departmentCode === "ALL";

    const whereClause: any = { deletedAt: null };

    if (!isAll) {
      whereClause.OR = [
        { department: { code: departmentCode } },
        { visibility: "UNIVERSITY" },
        { visibility: "COLLEGE" },
      ];
    }

    if (visibility && visibility !== "ALL") {
      whereClause.visibility = visibility;
    }

    const docs = await db.document.findMany({
      where: whereClause,
      include: {
        department: true,
        knowledgeBase: true,
        _count: {
          select: { chunks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = docs.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      fileType: d.fileType,
      fileSize: d.fileSize,
      processingStatus: d.processingStatus,
      visibility: d.visibility || "DEPARTMENT",
      uploadedBy: d.uploadedBy,
      departmentCode: d.department?.code || departmentCode,
      departmentName: d.department?.name || "Department Scope",
      knowledgeBaseName: d.knowledgeBase?.name || "Academic Knowledge Base",
      chunksCount: d._count?.chunks || 0,
      createdAt: d.createdAt,
    }));

    return NextResponse.json({ success: true, documents: enriched });
  } catch (error: any) {
    console.error("[API: /api/hod/documents] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load documents" }, { status: 500 });
  }
}
