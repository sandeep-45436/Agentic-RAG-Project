import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/db/prisma";
import { DocumentService } from "@/server/services/document.service";
import { DocumentAccessPolicy, DocumentAccessContext } from "@/server/services/document-access-policy";
import { DocumentVisibility } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const requestedVisibility = searchParams.get("visibility") as DocumentVisibility | null;

    let cookieStore: any = null;
    let sessionCookie: any = null;
    try {
      cookieStore = await cookies();
      sessionCookie = cookieStore.get("faculty_session");
    } catch {}

    let facultyUser: any = null;
    if (sessionCookie?.value) {
      try {
        facultyUser = JSON.parse(sessionCookie.value);
      } catch {}
    }

    if (!facultyUser) {
      const defaultFaculty = await db.faculty.findFirst({
        where: { deletedAt: null },
        orderBy: { facultyCode: "asc" },
        include: { user: true, department: true },
      });
      if (defaultFaculty) {
        facultyUser = {
          id: defaultFaculty.id,
          userId: defaultFaculty.userId,
          name: defaultFaculty.user?.name || "Prof. John Smith",
          facultyCode: defaultFaculty.facultyCode || "FAC-CS-001",
          departmentId: defaultFaculty.departmentId,
          departmentCode: defaultFaculty.department?.code || "CS",
          departmentName: defaultFaculty.department?.name || "Computer Science",
          organizationId: defaultFaculty.organizationId,
          role: "FACULTY",
        };
      }
    }

    const organizationId = facultyUser?.organizationId || "seed-org-001";

    // Build RBAC access context
    const accessContext: DocumentAccessContext = {
      organizationId,
      userId: facultyUser?.userId || facultyUser?.id,
      facultyId: facultyUser?.id,
      userRole: (facultyUser?.role || "FACULTY") as any,
      departmentId: facultyUser?.departmentId,
      collegeId: facultyUser?.collegeId,
    };

    const baseWhere = DocumentAccessPolicy.buildPrismaDocumentWhere(accessContext);

    // Apply search query and visibility filters on top of the security where clause
    const whereClause: any = {
      ...baseWhere,
      ...(requestedVisibility ? { visibility: requestedVisibility } : {}),
      ...(query
        ? {
            AND: [
              {
                OR: [
                  { fileName: { contains: query, mode: "insensitive" } },
                  { content: { contains: query, mode: "insensitive" } },
                ],
              },
            ],
          }
        : {}),
    };

    const documents = await db.document.findMany({
      where: whereClause,
      include: {
        department: true,
        college: true,
        knowledgeBase: true,
        _count: {
          select: { chunks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute department stats
    const totalDeptDocs = facultyUser?.departmentId
      ? await db.document.count({
          where: {
            organizationId,
            departmentId: facultyUser.departmentId,
            deletedAt: null,
          },
        })
      : 0;

    const totalUnivDocs = await db.document.count({
      where: {
        organizationId,
        visibility: "UNIVERSITY",
        deletedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      documents,
      facultyContext: {
        facultyName: facultyUser?.name,
        facultyCode: facultyUser?.facultyCode,
        departmentCode: facultyUser?.departmentCode,
        departmentName: facultyUser?.departmentName,
        departmentId: facultyUser?.departmentId,
        totalDeptDocs,
        totalUnivDocs,
      },
    });
  } catch (error: any) {
    console.error("[API: /api/faculty/documents GET] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("faculty_session");
    let facultyUser: any = null;

    if (sessionCookie?.value) {
      try {
        facultyUser = JSON.parse(sessionCookie.value);
      } catch {}
    }

    if (!facultyUser) {
      return NextResponse.json(
        { error: "Unauthorized: Active faculty session required for uploading documents." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const category = (formData.get("category") as string) || "Academic Document";
    const courseCode = (formData.get("courseCode") as string) || "";
    const requestedVisibility = ((formData.get("visibility") as string) || "DEPARTMENT") as DocumentVisibility;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Server-enforced identity and boundary: Never trust client department override
    const organizationId = facultyUser.organizationId || "seed-org-001";
    const departmentId = facultyUser.departmentId || null;
    const collegeId = facultyUser.collegeId || null;
    const uploadedBy = facultyUser.id;
    const userRole = facultyUser.role || "FACULTY";

    // Validate and enforce allowed visibility
    const visCheck = DocumentAccessPolicy.canUploadWithVisibility(userRole, requestedVisibility);
    const effectiveVisibility = visCheck.effectiveVisibility;

    // Default Knowledge Base for academic docs if not passed
    let kb = await db.knowledgeBase.findFirst({
      where: { organizationId, deletedAt: null },
    });

    if (!kb) {
      kb = await db.knowledgeBase.create({
        data: {
          organizationId,
          name: "Faculty Academic Repository",
          description: "Department Syllabi, Question Banks, Timetables, and Regulations",
        },
      });
    }

    // Process file upload with explicit server-assigned department, college, and visibility
    const document = await DocumentService.uploadDocument(
      file,
      organizationId,
      uploadedBy,
      kb.id,
      departmentId,
      collegeId,
      effectiveVisibility
    );

    const fileBuffer = await file.arrayBuffer();

    // Trigger async processing in background (indexing into Qdrant vector DB with RBAC metadata and Neo4j graph)
    DocumentService.processDocumentAsync(
      document.id,
      fileBuffer,
      organizationId,
      kb.id,
      `[${category}${courseCode ? ` - ${courseCode}` : ""}] ${document.fileName}`
    ).catch((err) => {
      console.error("[Faculty Upload] Background processing failed:", err?.message || err);
    });

    return NextResponse.json({
      success: true,
      message: `${category} uploaded to ${facultyUser.departmentCode || "Department"} successfully with ${effectiveVisibility} visibility`,
      document,
      effectiveVisibility,
    });
  } catch (error: any) {
    console.error("[API: /api/faculty/documents POST] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload document" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("faculty_session");
    let facultyUser: any = null;

    if (sessionCookie?.value) {
      try {
        facultyUser = JSON.parse(sessionCookie.value);
      } catch {}
    }

    if (!facultyUser) {
      return NextResponse.json(
        { error: "Unauthorized: Active faculty session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const doc = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!doc || doc.deletedAt) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const accessContext: DocumentAccessContext = {
      organizationId: facultyUser.organizationId || doc.organizationId,
      userId: facultyUser.userId || facultyUser.id,
      facultyId: facultyUser.id,
      userRole: (facultyUser.role || "FACULTY") as any,
      departmentId: facultyUser.departmentId,
      collegeId: facultyUser.collegeId,
    };

    // Evaluate deletion rights via policy
    const delCheck = DocumentAccessPolicy.canDeleteDocument(accessContext, doc);
    if (!delCheck.allowed) {
      return NextResponse.json(
        { error: delCheck.reason || "Unauthorized to delete this document." },
        { status: 403 }
      );
    }

    await db.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Document deleted successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete document" }, { status: 500 });
  }
}
