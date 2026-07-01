import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/server/db/prisma";
import { DocumentService } from "@/server/services/document.service";
import { syncUserToDatabase } from "@/server/actions/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let membership = await db.membership.findFirst({
      where: { userId: user.id },
    });

    if (!membership) {
      await syncUserToDatabase();
      membership = await db.membership.findFirst({
        where: { userId: user.id },
      });
      if (!membership) {
        return NextResponse.json({ error: "No organization found" }, { status: 403 });
      }
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    // Save the file to Supabase Storage + create DB record
    const document = await DocumentService.uploadDocument(
      file,
      membership.organizationId,
      user.id
    );

    // Read buffer before the response closes
    const fileBuffer = await file.arrayBuffer();

    // Run processing in the background without blocking the HTTP response.
    // We intentionally do NOT await this — the response returns immediately.
    // Any error is caught internally and marks the document as FAILED.
    DocumentService.processDocumentAsync(
      document.id,
      fileBuffer,
      membership.organizationId,
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
