import { normalizeChunkText, generateDocumentHash, generateChunkHash } from "../server/utils/chunk-hasher";
import { CitationService } from "../server/services/citation.service";
import { CitationGroundingValidator } from "../ai/knowledge/citation-grounding-validator";
import { EvidenceVerifier } from "../ai/knowledge/evidence-verifier";
import { VectorPayload } from "../server/services/vector.service";

async function runPhase55Tests() {
  console.log("=================================================");
  console.log("🧪 RUNNING PHASE 5.5 GROUNDING & HYGIENE TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // --- Test 1: Deterministic Text Normalization ---
  const rawText = "  Minimum   attendance\r\n\r\nis 75%.   ";
  const normalized = normalizeChunkText(rawText);
  assert(normalized === "Minimum attendance\nis 75%.", "Test 1: Text normalization collapses CRLF and spaces");

  // --- Test 2: Deterministic Chunk Hashing & Document Hash ---
  const docHash1 = generateDocumentHash("Sample Document Content 2026");
  const docHash2 = generateDocumentHash("Sample Document Content 2026");
  assert(docHash1 === docHash2, "Test 2a: Identical document content produces identical SHA-256 docHash");

  const chunkHashA = generateChunkHash("doc_100", 1, 0, rawText);
  const chunkHashB = generateChunkHash("doc_100", 1, 0, "Minimum attendance\nis 75%.");
  assert(chunkHashA.chunkHash === chunkHashB.chunkHash, "Test 2b: Normalized text produces identical chunkHash");
  assert(chunkHashA.chunkId === chunkHashB.chunkId, "Test 2c: Normalized text produces identical UUID chunkId");

  // --- Test 3: Citation Formatting with Lineage Metadata ---
  const sampleChunks: VectorPayload[] = [
    {
      organizationId: "org_test",
      documentId: "doc_100",
      documentName: "Academic_Policy.pdf",
      documentVersion: 3,
      version: 3,
      isLatest: true,
      docHash: docHash1,
      chunkId: chunkHashA.chunkId,
      chunkHash: chunkHashA.chunkHash,
      chunkIndex: 0,
      chunkText: "Students must maintain a minimum attendance of 75% to qualify for end-semester examinations.",
      pageNumber: 14,
      sectionHeader: "Attendance Criteria",
    },
  ];

  const formattedCitations = CitationService.formatCitations(sampleChunks);
  assert(formattedCitations.includes("[Citation ID: 1]"), "Test 3a: Formatted citation includes Citation ID tag");
  assert(formattedCitations.includes("(v3, Chunk: 0)"), "Test 3b: Formatted citation includes canonical document version");
  assert(formattedCitations.includes("Page: 14"), "Test 3c: Formatted citation includes page number");

  // --- Test 4: Citation Grounding Validator - Valid Grounded Answer ---
  const validResponse = "University policy requires a minimum attendance of 75% for all students. [Citation ID: 1]";
  const validReport = CitationGroundingValidator.validateCitationGrounding(validResponse, sampleChunks, 0);
  assert(validReport.isGrounded === true, "Test 4a: Valid claim citing supporting chunk returns isGrounded=true");
  assert(validReport.recommendedAction === "PASS", "Test 4b: Valid grounded response yields PASS action");

  // --- Test 5: Citation Grounding Validator - Misattributed Citation ---
  const misattributedResponse = "Students with 50% attendance automatically pass. [Citation ID: 1]";
  const misattributedReport = CitationGroundingValidator.validateCitationGrounding(misattributedResponse, sampleChunks, 0);
  assert(misattributedReport.isGrounded === false, "Test 5a: Unsupported claim citing chunk returns isGrounded=false");
  assert(misattributedReport.misattributedCitations.length > 0, "Test 5b: Flagged misattributed citation");

  // --- Test 6: Citation Grounding Validator - Non-Existent Citation ID ---
  const invalidIdResponse = "Students must wear ID cards at all times. [Citation ID: 99]";
  const invalidIdReport = CitationGroundingValidator.validateCitationGrounding(invalidIdResponse, sampleChunks, 0);
  assert(invalidIdReport.isGrounded === false, "Test 6a: Reference to missing citation ID returns isGrounded=false");

  // --- Test 7: Combined DB Fact & Document Claim ---
  const dbResponse = "Student STU001 has 68.3% attendance. Therefore, the student fails the 75% attendance policy. [Citation ID: 1]";
  const dbReport = CitationGroundingValidator.validateCitationGrounding(dbResponse, sampleChunks, 1);
  assert(dbReport.isGrounded === true, "Test 7a: Multi-source DB + Document claim returns isGrounded=true");

  // --- Test 8: Evidence Verifier Integration ---
  const verifierReport = EvidenceVerifier.verifyEvidence(sampleChunks, 0.40, validResponse, 0);
  assert(verifierReport.recommendedAction === "PASS", "Test 8a: EvidenceVerifier returns PASS for grounded response");
  assert(verifierReport.verifiedChunks.length === 1, "Test 8b: EvidenceVerifier verifies valid chunks");

  console.log("\n=================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase55Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
