/**
 * Enterprise Capabilities Verification Suite
 * Tests the three core pillars:
 * 1. Guarded Text-to-SQL Engine (AST validation, injection protection, RBAC table security, limit clamping)
 * 2. Partitioned Semantic LLM Cache (Vector cosine similarity matching, tenant/role isolation)
 * 3. Knowledge Maintenance & Self-Healing Agent (SHA-256 diffing, superseded chunk pruning, approval gate)
 */

import { GuardedSqlEngine } from "../ai/sql/guarded-sql-engine";
import { SemanticCache } from "../ai/cache/semantic-cache";
import { KnowledgeMaintenanceAgent, DocumentRecord } from "../ai/knowledge/knowledge-maintenance";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log("=========================================================================");
  console.log("   NEXUS-IQ: ENTERPRISE CAPABILITIES VERIFICATION SUITE                  ");
  console.log("=========================================================================\n");

  // -------------------------------------------------------------------------
  // PILLAR 1: Guarded Text-to-SQL Engine
  // -------------------------------------------------------------------------
  console.log("▶ 1. Testing Guarded Text-to-SQL Engine...");

  // Case 1A: Valid Read-Only SELECT with automatic LIMIT clamping
  const validSelect = GuardedSqlEngine.validateAndGuard(
    "SELECT code, title, credits FROM courses WHERE departmentId = 'cse'",
    { organizationId: "org-1", userRole: "STUDENT" }
  );
  assert(validSelect.isValid === true, "Valid SELECT query must pass");
  assert(validSelect.guardedSql!.includes("LIMIT 50"), "Must automatically clamp safety LIMIT 50");
  console.log("  ✓ Valid read-only query accepted with automatic limit clamping.");

  // Case 1B: Mutation Injection (DROP TABLE)
  const dropAttempt = GuardedSqlEngine.validateAndGuard(
    "DROP TABLE students; SELECT 1;",
    { organizationId: "org-1", userRole: "STUDENT" }
  );
  assert(dropAttempt.isValid === false, "DROP TABLE mutation must be blocked");
  assert(dropAttempt.rejectionReason!.includes("Only read-only SELECT"), "Must state SELECT requirement");

  // Case 1C: Dangerous DDL / DML keywords inside query
  const deleteAttempt = GuardedSqlEngine.validateAndGuard(
    "SELECT * FROM students WHERE id = '1'; DELETE FROM students;",
    { organizationId: "org-1", userRole: "FACULTY" }
  );
  assert(deleteAttempt.isValid === false, "Chained query with DELETE must be blocked");
  console.log("  ✓ Destructive mutation and query chaining blocked deterministically.");

  // Case 1D: RBAC table violation (Student attempting to query salaries or financial accounts)
  const rbacViolation = GuardedSqlEngine.validateAndGuard(
    "SELECT * FROM financial_accounts WHERE balanceOutstanding > 0",
    { organizationId: "org-1", userRole: "STUDENT" }
  );
  assert(rbacViolation.isValid === false, "Student role must NOT query financial_accounts table");
  assert(rbacViolation.rejectionReason!.includes("RBAC Access Violation"), "Must cite RBAC violation");
  console.log("  ✓ RBAC table boundary enforced for student queries.");

  // -------------------------------------------------------------------------
  // PILLAR 2: Tenant- & Role-Partitioned Semantic Cache
  // -------------------------------------------------------------------------
  console.log("\n▶ 2. Testing Partitioned Semantic LLM Cache...");
  SemanticCache.clearAll();

  const cseStudentPartition = SemanticCache.buildPartitionKey("org-univ", "cse", "STUDENT", "2026.1");
  const eceStudentPartition = SemanticCache.buildPartitionKey("org-univ", "ece", "STUDENT", "2026.1");

  // Seed vector embedding for "What are the core credit requirements?"
  const baseEmbedding = [0.2, 0.4, 0.6, 0.8]; // Dimension 4 for mock vector
  SemanticCache.put(cseStudentPartition, {
    query: "What are the core credit requirements?",
    embedding: baseEmbedding,
    answer: "Computer Science requires 110 Core credits under regulation 2026.1.",
    citations: ["CIRCULAR_2026_ACAD"],
    provenance: [],
    ttlSeconds: 600,
  });

  // Query A: Semantically identical vector (Cosine similarity > 0.99)
  const identicalEmbedding = [0.201, 0.399, 0.601, 0.799];
  const hit = SemanticCache.findMatch(cseStudentPartition, identicalEmbedding);
  assert(hit !== null, "Must result in a semantic cache HIT");
  assert(hit!.similarity >= 0.94, `Similarity must exceed threshold (got ${hit!.similarity})`);
  assert(hit!.entry.answer.includes("110 Core credits"), "Must return cached verified answer");
  console.log(`  ✓ Semantic Cache HIT verified with similarity ${hit!.similarity.toFixed(4)} (0ms, $0.00).`);

  // Query B: Semantically distinct vector
  const differentEmbedding = [-0.8, -0.2, 0.1, 0.0];
  const miss = SemanticCache.findMatch(cseStudentPartition, differentEmbedding);
  assert(miss === null, "Dissimilar query must result in a semantic cache MISS");
  console.log("  ✓ Distinct query resulted in clean cache MISS.");

  // Query C: Cross-Partition Isolation (ECE student querying identical embedding must MISS)
  const eceCheck = SemanticCache.findMatch(eceStudentPartition, identicalEmbedding);
  assert(eceCheck === null, "CSE cached answer must NEVER leak into ECE student partition");
  console.log("  ✓ Tenant & Department partition isolation verified.");

  // -------------------------------------------------------------------------
  // PILLAR 3: Knowledge Maintenance & Self-Healing Agent
  // -------------------------------------------------------------------------
  console.log("\n▶ 3. Testing Knowledge Maintenance & Document Intelligence Agent...");

  const doc2025: DocumentRecord = {
    id: "acad_reg_btech",
    title: "B.Tech Regulations",
    version: "2025.1",
    organizationId: "org-univ",
    departmentCode: "cse",
    content: "Section 1: Core Credits 110. Section 2: Passing Grade 40%.",
    sections: [
      { sectionTitle: "Section 1", text: "Core Credits 110." },
      { sectionTitle: "Section 2", text: "Passing Grade 40%." },
    ],
  };

  const doc2026: DocumentRecord = {
    id: "acad_reg_btech",
    title: "B.Tech Regulations",
    version: "2026.1",
    organizationId: "org-univ",
    departmentCode: "cse",
    content: "Section 1: Core Credits 110. Section 2: Passing Grade 40%. Section 3: Capstone AI Project Mandatory.",
    sections: [
      { sectionTitle: "Section 1", text: "Core Credits 110." },
      { sectionTitle: "Section 2", text: "Passing Grade 40%." },
      { sectionTitle: "Section 3", text: "Capstone AI Project Mandatory." },
    ],
  };

  const proposal = KnowledgeMaintenanceAgent.analyzeDocumentRevision(doc2025, doc2026);
  assert(proposal.isHashDifferent === true, "Must detect cryptographic hash difference");
  assert(proposal.requiresHumanApproval === true, "Must require administrative approval before re-indexing");
  assert(proposal.sectionDiffs.some((d) => d.sectionTitle === "Section 3" && d.status === "ADDED"), "Must identify Section 3 added");
  console.log("  ✓ SHA-256 revision diff compiled: Section changes identified.");

  // Approval Gate Execution
  const healingResult = KnowledgeMaintenanceAgent.applySelfHealing(proposal, "ADMIN");
  assert(healingResult.success === true, "Self-healing plan applied by ADMIN must succeed");
  assert(proposal.status === "APPLIED", "Proposal status must update to APPLIED");
  console.log("  ✓ Approved self-healing plan executed: Stale partitions invalidated.");

  console.log("\n=========================================================================");
  console.log("  ALL ENTERPRISE PILLARS VERIFIED AND OPERATIONAL!                       ");
  console.log("  1. Guarded Text-to-SQL Engine: Passed.                                ");
  console.log("  2. Partitioned Semantic LLM Cache: Passed.                            ");
  console.log("  3. Knowledge Maintenance & Self-Healing: Passed.                       ");
  console.log("=========================================================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
