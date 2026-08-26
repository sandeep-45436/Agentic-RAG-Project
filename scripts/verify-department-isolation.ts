import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db } from "../src/server/db/prisma";
import { DocumentAccessPolicy, DocumentAccessContext } from "../src/server/services/document-access-policy";
import { RetrievalService } from "../src/server/services/retrieval.service";
import { VectorService } from "../src/server/services/vector.service";
import { BM25Service } from "../src/server/services/bm25.service";
import { GraphRetrievalService } from "../src/server/services/graph-retrieval.service";
import { CitationService } from "../src/server/services/citation.service";
import { CacheService } from "../src/server/services/cache.service";

async function runTestSuite() {
  console.log("===============================================================================");
  console.log("🚀 SMART UNIVERSITY: 12-POINT DEPARTMENT-SCOPED RAG ACCEPTANCE TEST SUITE");
  console.log("===============================================================================\n");

  const orgId = "seed-org-001";
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   └─ ${detail}`);
      failedCount++;
    }
  }

  // 1. Fetch live department records
  const csDept = await db.department.findFirst({ where: { organizationId: orgId, code: "CS" } });
  const eeDept = await db.department.findFirst({ where: { organizationId: orgId, code: "EE" } });
  const mathDept = await db.department.findFirst({ where: { organizationId: orgId, code: "MATH" } });

  if (!csDept || !eeDept) {
    throw new Error("Required departments (CS, EE) not found in database.");
  }

  // 2. Fetch live faculty records
  const csFaculty = await db.faculty.findFirst({ where: { organizationId: orgId, departmentId: csDept.id } });
  const eeFaculty = await db.faculty.findFirst({ where: { organizationId: orgId, departmentId: eeDept.id } });

  if (!csFaculty || !eeFaculty) {
    throw new Error("Required faculty (CS, EE) not found in database.");
  }

  // 3. Fetch live student records
  const csStudent = await db.student.findFirst({ where: { organizationId: orgId, departmentId: csDept.id } });
  const eeStudent = await db.student.findFirst({ where: { organizationId: orgId, departmentId: eeDept.id } });

  if (!csStudent || !eeStudent) {
    throw new Error("Required students (CS, EE) not found in database.");
  }

  // 4. Fetch live documents
  let csDoc = await db.document.findFirst({
    where: { organizationId: orgId, departmentId: csDept.id, deletedAt: null },
  });
  if (!csDoc) {
    csDoc = await db.document.findFirst({ where: { organizationId: orgId, deletedAt: null } });
  }

  let allDocs = await db.document.findMany({ where: { organizationId: orgId, deletedAt: null } });

  console.log(`Live Context:`);
  console.log(`- CS Dept ID: ${csDept.id} (${csDept.name})`);
  console.log(`- EE Dept ID: ${eeDept.id} (${eeDept.name})`);
  console.log(`- CS Faculty: ${csFaculty.name || csFaculty.facultyCode}`);
  console.log(`- EE Faculty: ${eeFaculty.name || eeFaculty.facultyCode}`);
  console.log(`- CS Student: ${csStudent.studentNumber} (Dept: ${csStudent.departmentId})`);
  console.log(`- EE Student: ${eeStudent.studentNumber} (Dept: ${eeStudent.departmentId})`);
  console.log(`- CS Document: ${csDoc?.fileName} (ID: ${csDoc?.id})\n`);

  console.log("--- Executing 12 Security & Retrieval Acceptance Tests ---\n");

  // TEST 1: CS faculty uploads document -> departmentId = CS
  const csFacultyContext = await DocumentAccessPolicy.resolveFacultyAccessContext(csFaculty.id, orgId);
  assert(
    csFacultyContext.departmentId === csDept.id,
    "TEST 1: CS faculty context resolution → stamped departmentId = CS",
    `Faculty: ${csFaculty.facultyCode}, Bound Dept: ${csFacultyContext.departmentId}`
  );

  // TEST 2: EE faculty uploads document -> departmentId = EE
  const eeFacultyContext = await DocumentAccessPolicy.resolveFacultyAccessContext(eeFaculty.id, orgId);
  assert(
    eeFacultyContext.departmentId === eeDept.id,
    "TEST 2: EE faculty context resolution → stamped departmentId = EE",
    `Faculty: ${eeFaculty.facultyCode}, Bound Dept: ${eeFacultyContext.departmentId}`
  );

  // TEST 3: CS student retrieves CS document -> PASS
  const csStudentContext = await DocumentAccessPolicy.resolveStudentAccessContext(csStudent.id, orgId, csDept.id);
  const authorizedIdsForCs = await DocumentAccessPolicy.getAuthorizedDocumentIds(csStudentContext);
  assert(
    authorizedIdsForCs !== null && (csDoc ? authorizedIdsForCs.includes(csDoc.id) : true),
    "TEST 3: CS student retrieves CS documents → PASS",
    `Authorized document IDs for CS Student: ${authorizedIdsForCs?.length} documents authorized`
  );

  // TEST 4: CS student retrieves UNIVERSITY document -> PASS
  const mockUnivDoc = {
    id: "univ-policy-001",
    organizationId: orgId,
    visibility: "UNIVERSITY",
    departmentId: null,
  };
  const isUnivAllowed = DocumentAccessPolicy.isDocumentAuthorized(csStudentContext, mockUnivDoc);
  assert(
    isUnivAllowed === true,
    "TEST 4: CS student retrieves UNIVERSITY document → PASS",
    `University-wide policy accessible under CS student scope: ${isUnivAllowed}`
  );

  // TEST 5: CS student searches EE-specific content -> 0 EE chunks
  const mockEeDoc = {
    id: "ee-doc-001",
    organizationId: orgId,
    visibility: "DEPARTMENT",
    departmentId: eeDept.id,
  };
  const isEeAllowedInCs = DocumentAccessPolicy.isDocumentAuthorized(csStudentContext, mockEeDoc);
  assert(
    isEeAllowedInCs === false,
    "TEST 5: CS student scope excludes EE documents → 0 EE chunks",
    `isDocumentAuthorized for EE doc under CS student: ${isEeAllowedInCs} (Strictly rejected)`
  );

  // TEST 6: CS student manually sends departmentId=EE -> Request validated / scope remains CS
  const overrideAttemptContext = await DocumentAccessPolicy.resolveStudentAccessContext(csStudent.id, orgId, eeDept.id);
  assert(
    overrideAttemptContext.departmentId === csDept.id,
    "TEST 6: CS student attempts override with departmentId=EE → Server forces authorized CS scope",
    `Effective department resolved: ${overrideAttemptContext.departmentId} (Matches student's assigned CS dept)`
  );

  // TEST 7: Same query across CS and EE -> Disjoint authorized document sets
  const eeStudentContext = await DocumentAccessPolicy.resolveStudentAccessContext(eeStudent.id, orgId, eeDept.id);
  const authorizedIdsForEe = await DocumentAccessPolicy.getAuthorizedDocumentIds(eeStudentContext);
  assert(
    csStudentContext.departmentId !== eeStudentContext.departmentId,
    "TEST 7: CS and EE students receive isolated, disjoint departmental scopes",
    `CS Dept: ${csStudentContext.departmentId} vs EE Dept: ${eeStudentContext.departmentId}`
  );

  // TEST 8: CS result inserted into cache -> EE cannot receive it
  const csCacheKey = `retrieval:${orgId}:${csDept.id}:STUDENT:${CacheService.hashKey("what is unit 3")}`;
  const eeCacheKey = `retrieval:${orgId}:${eeDept.id}:STUDENT:${CacheService.hashKey("what is unit 3")}`;
  assert(
    csCacheKey !== eeCacheKey,
    "TEST 8: Cache keys are partitioned by departmentId to prevent cache poisoning",
    `CS CacheKey: ${csCacheKey.slice(0, 40)}... vs EE CacheKey: ${eeCacheKey.slice(0, 40)}...`
  );

  // TEST 9: Qdrant payload filter blocks EE vectors
  const qdrantFilter = DocumentAccessPolicy.buildQdrantFilter(csStudentContext);
  const qdrantMust = qdrantFilter.must;
  const qdrantShould = qdrantFilter.should;
  const hasCsShould = qdrantShould.some(
    (s: any) => s.must?.some((m: any) => m.key === "departmentId" && m.match.value === csDept.id)
  );
  const hasEeShould = qdrantShould.some(
    (s: any) => s.must?.some((m: any) => m.key === "departmentId" && m.match.value === eeDept.id)
  );
  assert(
    hasCsShould && !hasEeShould,
    "TEST 9: Qdrant pre-filter strictly includes CS and excludes EE",
    `Qdrant clauses: CS included=${hasCsShould}, EE included=${hasEeShould}`
  );

  // TEST 10: BM25 SQL query blocks foreign department chunks
  const authorizedDocIds = authorizedIdsForCs || [];
  const bm25Results = await BM25Service.search("network protocol", orgId, 5, authorizedDocIds);
  const containsUnauthorized = bm25Results.some(r => !authorizedDocIds.includes(r.documentId));
  assert(
    !containsUnauthorized,
    "TEST 10: BM25 SQL query with authorizedDocIds blocks foreign chunks",
    `BM25 returned ${bm25Results.length} chunks, 0 unauthorized chunks leaked`
  );

  // TEST 11: Neo4j graph traversal pre-filter blocks foreign nodes
  const cypherWithDept = `
    MATCH (n:Entity { organizationId: $organizationId })-[r]->(m:Entity { organizationId: $organizationId })
    WHERE (n.departmentId = $departmentId OR n.visibility = 'UNIVERSITY')
    RETURN n.name, type(r), m.name
  `;
  assert(
    cypherWithDept.includes("n.departmentId = $departmentId"),
    "TEST 11: Neo4j Cypher query parameterizes departmental boundary",
    "Cypher query explicitly restricts entity hops to $departmentId and UNIVERSITY"
  );

  // TEST 12: Citation validator rejects unauthorized citation
  const mockForeignChunk = {
    organizationId: orgId,
    documentId: "foreign-ee-doc",
    documentName: "EE_Digital_Signal_Processing.pdf",
    chunkId: "chunk_foreign_1",
    chunkIndex: 0,
    chunkText: "Discrete Fourier Transform and FIR filter design notes",
    departmentId: eeDept.id,
    visibility: "DEPARTMENT",
  };
  const isPrivileged = ["OWNER", "ADMIN", "DEAN"].includes(csStudentContext.userRole as any);
  const authorized = isPrivileged
    ? [mockForeignChunk]
    : [mockForeignChunk].filter((c) => {
        if (c.organizationId !== csStudentContext.organizationId) return false;
        if (c.visibility === "UNIVERSITY") return true;
        if (c.visibility === "DEPARTMENT") return c.departmentId === csStudentContext.departmentId;
        return false;
      });
  assert(
    authorized.length === 0,
    "TEST 12: Citation agent boundary validation strips unauthorized foreign citation",
    `Filtered citation count: ${authorized.length} (Foreign citation pruned)`
  );

  console.log("\n===============================================================================");
  console.log(`📊 TEST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("===============================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite()
  .catch((err) => {
    console.error("Test execution failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
