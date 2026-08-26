import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { DocumentService } from "@/server/services/document.service";
import { DocumentAccessPolicy } from "@/server/services/document-access-policy";
import { syncUserToDatabase } from "@/server/actions/auth";
import { validateApiKeyRequest } from "@/server/utils/api-key-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let organizationId: string | null = null;
    let userId: string | null = null;

    const insforge = await createClient();
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
    const user = userData?.user;

    if (user) {
      userId = user.id;
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
      const preferred = memberships.find(m => m.organizationId === "seed-org-001" || m.organization._count.documents > 0) || memberships[0];
      if (preferred) {
        organizationId = preferred.organizationId;
      }
    } else {
      // Fallback to API Key authentication
      const apiKeyAuth = await validateApiKeyRequest(request);
      if (apiKeyAuth) {
        organizationId = apiKeyAuth.organizationId;
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    // Resolve student/faculty access context for department tagging
    const accessContext = userId
      ? await DocumentAccessPolicy.resolveStudentAccessContext(userId, organizationId)
      : null;

    // Save the file to InsForge Storage + create DB record with department scope
    const document = await DocumentService.uploadDocument(
      file,
      organizationId,
      userId || "api_key_auth",
      undefined,
      accessContext?.departmentId || undefined,
      undefined,
      "DEPARTMENT"
    );

    // Read buffer before the response closes
    const fileBuffer = await file.arrayBuffer();

    // Run processing in the background without blocking the HTTP response.
    // We intentionally do NOT await this — the response returns immediately.
    // Any error is caught internally and marks the document as FAILED.
    DocumentService.processDocumentAsync(
      document.id,
      fileBuffer,
      organizationId,
      document.knowledgeBaseId || undefined,
      document.fileName
    ).catch((err) => {
      console.error("[Upload] Background processing failed for document", document.id, err?.message ?? err);
    });

    return NextResponse.json({ success: true, document });
  } catch (error: any) {
    console.error("Upload API failed:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
