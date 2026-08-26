import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db } from "../src/server/db/prisma";
import { FacultyService } from "../src/server/services/faculty.service";
import { ConversationService } from "../src/server/services/conversation.service";
import { DocumentAccessPolicy } from "../src/server/services/document-access-policy";

async function verifyAllPortalFlows() {
  console.log("===============================================================================");
  console.log("🔍 TESTING END-TO-END FLOWS: FACULTY AUTH, DOCUMENTS, CHAT, & SCOPING");
  console.log("===============================================================================\n");

  const orgId = "seed-org-001";
  let passed = 0;
  let failed = 0;

  function test(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      if (details) console.log(`   └─ ${details}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
      if (details) console.error(`   └─ ${details}`);
      failed++;
    }
  }

  // 1. Test Faculty Authentication
  console.log("1. Testing Faculty Sign-In Flow...");
  const authRes = await FacultyService.authenticateFaculty("FAC-CS-001", "Faculty@CS2026!");
  test(
    "Faculty Authentication with FAC-CS-001",
    authRes.success === true && !!authRes.faculty,
    `Authenticated as ${authRes.faculty?.name} (${authRes.faculty?.departmentCode})`
  );

  // 2. Test Faculty Profile Fetch
  if (authRes.faculty?.id) {
    const profile = await FacultyService.getFacultyProfile(authRes.faculty.id);
    test(
      "Faculty Profile Retrieval",
      profile !== null && profile.id === authRes.faculty.id,
      `Profile loaded: ${profile?.title} ${profile?.user?.name || profile?.facultyCode}, Uploads: ${profile?.uploadedDocsCount}`
    );
  }

  // 3. Test Faculty Document Listing & Filtering
  console.log("\n2. Testing Faculty Document Repository & Access Policies...");
  const csDept = await db.department.findFirst({ where: { organizationId: orgId, code: "CS" } });
  const facultyContext = {
    organizationId: orgId,
    userId: authRes.faculty?.userId || authRes.faculty?.id || "fac_1",
    userRole: "FACULTY",
    departmentId: csDept?.id || null,
  };
  const whereClause = DocumentAccessPolicy.buildPrismaDocumentWhere(facultyContext as any);
  const docs = await db.document.findMany({
    where: whereClause,
    include: {
      department: true,
      _count: { select: { chunks: true } },
    },
    take: 5,
  });
  test(
    "Faculty Document Query Execution",
    Array.isArray(docs),
    `Retrieved ${docs.length} authorized documents for ${csDept?.code} department`
  );

  // 4. Test Document Detail & Chunk Preview Fetch
  if (docs.length > 0) {
    const docId = docs[0].id;
    const docDetail = await db.document.findFirst({
      where: { id: docId, deletedAt: null },
      include: {
        department: true,
        _count: { select: { chunks: true } },
        chunks: { take: 5, orderBy: { chunkIndex: "asc" } },
      },
    });
    test(
      "Document Detail & Chunk Preview",
      docDetail !== null && !!docDetail.fileName,
      `Document: ${docDetail?.fileName}, Preview Chunks Count: ${docDetail?.chunks?.length}`
    );
  }

  // 5. Test Chat Conversation Creation & Resilient Message Ingestion
  console.log("\n3. Testing Student Chat Conversation Creation & Message Storing...");
  const testUser = await db.user.findFirst();
  const userId = testUser?.id || "user_test_001";
  const conv = await ConversationService.createConversation(userId, orgId, "Test Diagnostic Chat");
  test(
    "Conversation Creation",
    conv !== null && !!conv.id,
    `Conversation ID: ${conv?.id}`
  );

  if (conv?.id) {
    // Add User Message
    const userMsg = await ConversationService.addMessage(
      conv.id,
      orgId,
      "USER",
      "Explain the attendance policy for smart university."
    );
    test(
      "User Message Ingestion in Conversation",
      userMsg !== null && userMsg.content.includes("attendance"),
      `Message stored with ID: ${userMsg?.id}`
    );

    // Add Assistant Message with Citation
    const asstMsg = await ConversationService.addMessage(
      conv.id,
      orgId,
      "ASSISTANT",
      "According to Section 4.2 of Academic Regulations [1], minimum attendance is 75%.",
      [{ documentName: "Academic_Regulations.pdf", pageNumber: 3 }]
    );
    test(
      "Assistant Grounded Message Ingestion with Citations",
      asstMsg !== null && !!asstMsg.citations,
      `Citations JSON persisted properly: ${asstMsg?.citations?.slice(0, 50)}...`
    );

    // Clean up test conversation
    await db.message.deleteMany({ where: { conversationId: conv.id } });
    await db.conversation.delete({ where: { id: conv.id } });
  }

  // 6. Test Student Access Context & Department Override Defense
  console.log("\n4. Testing Student Scope Resolution & Override Defense...");
  const csStudent = await db.student.findFirst({ where: { organizationId: orgId, departmentId: csDept?.id } });
  if (csStudent) {
    const eeDept = await db.department.findFirst({ where: { organizationId: orgId, code: "EE" } });
    const resolvedContext = await DocumentAccessPolicy.resolveStudentAccessContext(
      csStudent.id,
      orgId,
      eeDept?.id
    );
    test(
      "Student Department Override Defense",
      resolvedContext.departmentId === csDept?.id,
      `Student assigned to ${csDept?.code} cannot escape scope to ${eeDept?.code}`
    );
  }

  console.log("\n===============================================================================");
  console.log(`📊 DIAGNOSTIC SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================================\n");

  if (failed > 0) process.exit(1);
}

verifyAllPortalFlows()
  .catch((err) => {
    console.error("Diagnostic execution error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
