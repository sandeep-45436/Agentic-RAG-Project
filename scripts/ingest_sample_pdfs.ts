import * as fs from "fs";
import * as path from "path";
import { loadEnvConfig } from "@next/env";
import { db } from "../src/server/db/prisma";
import { DocumentService } from "../src/server/services/document.service";

loadEnvConfig(process.cwd(), true);

async function ingestAllSamplePdfs() {
  console.log("=================================================");
  console.log("   AUTOMATED DIRECT SAMPLE PDF INGESTION        ");
  console.log("=================================================\n");

  const sampleDir = path.join(process.cwd(), "sample_documents");
  if (!fs.existsSync(sampleDir)) {
    console.error("❌ Directory sample_documents not found!");
    process.exit(1);
  }

  const files = fs.readdirSync(sampleDir).filter((f) => f.endsWith(".pdf"));
  if (files.length === 0) {
    console.error("❌ No PDF files found in sample_documents!");
    process.exit(1);
  }

  // Get default Organization ID from seed or DB
  const org = await db.organization.findFirst();
  if (!org) {
    console.error("❌ No organization found in DB. Run 'npx prisma db seed' first.");
    process.exit(1);
  }

  const admin = await db.user.findFirst();
  const userId = admin?.id || "admin_user";

  for (const fileName of files) {
    const filePath = path.join(sampleDir, fileName);
    console.log(`\n📄 Ingesting file: ${fileName}...`);
    const buffer = fs.readFileSync(filePath);

    // Create DB document record
    const doc = await db.document.create({
      data: {
        fileName: fileName,
        fileType: "application/pdf",
        fileSize: buffer.length,
        storagePath: `sample/${fileName}`,
        organizationId: org.id,
        uploadedBy: userId,
        processingStatus: "PROCESSING",
      },
    });

    console.log(`  Document record created: ${doc.id}`);
    console.log(`  Processing text extraction, chunking, and Qdrant vector embedding...`);

    try {
      await DocumentService.processDocumentAsync(
        doc.id,
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        org.id,
        undefined,
        fileName
      );
      console.log(`  ✅ ${fileName} successfully processed and indexed!`);
    } catch (err: any) {
      console.error(`  ❌ Failed processing ${fileName}:`, err?.message || err);
    }
  }

  console.log("\n=================================================");
  console.log("🎉 ALL SAMPLE PDFS INGESTED AND INDEXED FOR RAG!");
  console.log("=================================================");
}

ingestAllSamplePdfs()
  .catch(console.error)
  .finally(() => db.$disconnect());
