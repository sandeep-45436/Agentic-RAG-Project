import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { DocumentDeliveryTool } from "@/ai/tools/document-delivery.tool";
import { Role } from "@/ai/tools/tool-registry";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await db.membership.findFirst({
      where: { userId: user.id },
    });
    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    const body = await req.json();
    const { operation, documentId, courseCode, pages, query } = body;

    if (!operation) {
      return NextResponse.json(
        { error: "Missing required field: operation" },
        { status: 400 }
      );
    }

    const validOperations = ["get_full_document", "get_pages", "get_section", "search_and_extract"];
    if (!validOperations.includes(operation)) {
      return NextResponse.json(
        { error: `Invalid operation. Must be one of: ${validOperations.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await DocumentDeliveryTool.execute({
      operation,
      documentId,
      courseCode,
      pages,
      query,
      organizationId: membership.organizationId,
      userId: user.id,
      userRole: (membership.role as Role) || "MEMBER",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({
      artifactId: result.result?.artifactId,
      downloadUrl: result.result?.downloadUrl,
      pages: result.result?.pages,
      totalPages: result.result?.totalPages,
      documentName: result.result?.documentName,
      provenance: result.result?.provenance,
      confidence: result.result?.confidence,
    });
  } catch (error: any) {
    console.error("[POST /api/documents/extract] Error:", error?.message ?? error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
