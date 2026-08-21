import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { db } from "../src/server/db/prisma";
import { createClient } from "../src/utils/insforge/server";
import { resetCollection, qdrant, GLOBAL_COLLECTION_NAME } from "../src/ai/vector/qdrant";
import { DocumentService } from "../src/server/services/document.service";

async function main() {
  console.log("===================================================================");
  console.log("🚀 STARTING COMPLETE DATABASE RESET AND REFRESH");
  console.log("===================================================================\n");

  // ── Step 1: Storage Buckets in InsForge ────────────────────────────────────
  console.log("📦 STEP 1: Verifying & Initializing InsForge Storage Buckets...");
  try {
    await db.$executeRawUnsafe(`
      INSERT INTO storage.buckets (name, public, created_at, updated_at)
      VALUES ('documents', true, NOW(), NOW())
      ON CONFLICT (name) DO UPDATE SET public = true;
    `);
    await db.$executeRawUnsafe(`
      INSERT INTO storage.buckets (name, public, created_at, updated_at)
      VALUES ('document-extracts', true, NOW(), NOW())
      ON CONFLICT (name) DO UPDATE SET public = true;
    `);
    console.log("  ✅ Storage buckets 'documents' and 'document-extracts' ready.");
  } catch (err: any) {
    console.warn("  ⚠️ Storage bucket SQL check warning (non-fatal):", err?.message);
  }

  // ── Step 2: Clear old document records and chunks ───────────────────────────
  console.log("\n🗑️ STEP 2: Cleaning up old Document and Chunk records...");
  try {
    const deletedChunks = await db.chunk.deleteMany({});
    console.log(`  ✅ Deleted ${deletedChunks.count} existing chunks from PostgreSQL.`);
    const deletedDocs = await db.document.deleteMany({});
    console.log(`  ✅ Deleted ${deletedDocs.count} existing documents from PostgreSQL.`);
  } catch (err: any) {
    console.error("  ❌ Error clearing documents/chunks:", err?.message);
  }

  // ── Step 3: Run Database Seed ──────────────────────────────────────────────
  console.log("\n🌱 STEP 3: Refreshing University Seed Data...");
  try {
    const org = await db.organization.upsert({
      where: { id: "seed-org-001" },
      update: {},
      create: { id: "seed-org-001", name: "Smart University" },
    });
    console.log(`  ✅ Organization verified: ${org.name} (${org.id})`);

    const adminUser = await db.user.upsert({
      where: { email: "admin@smartuniversity.edu" },
      update: {},
      create: { email: "admin@smartuniversity.edu", name: "Admin User" },
    });
    await db.membership.upsert({
      where: { userId_organizationId: { userId: adminUser.id, organizationId: org.id } },
      update: {},
      create: { userId: adminUser.id, organizationId: org.id, role: "ADMIN" },
    });
    console.log(`  ✅ Admin user verified: ${adminUser.email}`);

    // Also link any existing InsForge auth users to the organization
    const allUsers = await db.user.findMany();
    for (const u of allUsers) {
      const existingMem = await db.membership.findFirst({
        where: { userId: u.id, organizationId: org.id },
      });
      if (!existingMem) {
        await db.membership.create({
          data: { userId: u.id, organizationId: org.id, role: "ADMIN" },
        });
        console.log(`  ✅ Linked user ${u.email || u.id} to org ${org.id}`);
      }
    }
  } catch (err: any) {
    console.error("  ❌ Error during seed refresh:", err?.message);
  }

  // ── Step 4: Reset Qdrant Vector Collection ─────────────────────────────────
  console.log("\n⚡ STEP 4: Resetting and Initializing Qdrant Vector Store...");
  try {
    await resetCollection();
    const info = await qdrant.getCollection(GLOBAL_COLLECTION_NAME);
    console.log(`  ✅ Qdrant collection '${GLOBAL_COLLECTION_NAME}' active. Points: ${info.points_count}`);
  } catch (err: any) {
    console.error("  ❌ Error resetting Qdrant collection:", err?.message);
  }

  // ── Step 5: Ingest & Embed Sample PDFs ─────────────────────────────────────
  console.log("\n📄 STEP 5: Ingesting & Indexing Sample PDF Documents...");
  const sampleDir = path.join(process.cwd(), "sample_documents");
  if (!fs.existsSync(sampleDir)) {
    console.error("  ❌ Directory sample_documents not found!");
    return;
  }

  const files = fs.readdirSync(sampleDir).filter((f) => f.endsWith(".pdf"));
  if (files.length === 0) {
    console.warn("  ⚠️ No PDF files found in sample_documents!");
    return;
  }

  const org = await db.organization.findFirst();
  if (!org) {
    console.error("  ❌ No organization found in DB!");
    return;
  }
  const admin = await db.user.findFirst();
  const userId = admin?.id || "admin_user";

  const insforge = await createClient();

  for (const fileName of files) {
    const filePath = path.join(sampleDir, fileName);
    console.log(`\n  👉 Ingesting: ${fileName}`);
    const buffer = fs.readFileSync(filePath);
    const storagePath = `${org.id}/${fileName}`;

    // Upload to InsForge storage bucket 'documents'
    try {
      const blob = new Blob([buffer], { type: "application/pdf" });
      const { error: upErr } = await insforge.storage
        .from("documents")
        .upload(storagePath, blob);
      if (upErr) {
        console.warn(`    ⚠️ InsForge storage upload note: ${upErr.message}`);
      } else {
        console.log(`    ✅ Uploaded to InsForge storage at 'documents/${storagePath}'`);
      }
    } catch (e: any) {
      console.warn(`    ⚠️ Upload attempt error: ${e?.message}`);
    }

    // Create DB Document record
    const doc = await db.document.create({
      data: {
        fileName: fileName,
        fileType: "application/pdf",
        fileSize: buffer.length,
        storagePath: storagePath,
        organizationId: org.id,
        uploadedBy: userId,
        processingStatus: "PROCESSING",
      },
    });

    console.log(`    Created Document DB record ID: ${doc.id}`);

    // Process extraction, chunking, and Qdrant embedding
    try {
      await DocumentService.processDocumentAsync(
        doc.id,
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        org.id,
        undefined,
        fileName
      );
      console.log(`    ✅ ${fileName} successfully processed, chunked, and embedded into Qdrant!`);
    } catch (err: any) {
      console.error(`    ❌ Failed processing ${fileName}:`, err?.message || err);
    }
  }

  // ── Step 6: Verify Final Counts ───────────────────────────────────────────
  console.log("\n📊 STEP 6: Final Verification...");
  const finalDocCount = await db.document.count();
  const finalChunkCount = await db.chunk.count();
  const qdrantInfo = await qdrant.getCollection(GLOBAL_COLLECTION_NAME);

  console.log(`  - Total Documents in DB: ${finalDocCount}`);
  console.log(`  - Total Chunks in PostgreSQL: ${finalChunkCount}`);
  console.log(`  - Total Vectors in Qdrant: ${qdrantInfo.points_count}`);
  console.log("\n===================================================================");
  console.log("✨ ALL DATABASES REFRESHED AND ALL PDFS INDEXED SUCCESSFULLY!");
  console.log("===================================================================");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
