import assert from "node:assert";
import { UniversityDataSourceFactory } from "../server/data-source/data-source-factory";
import { DataQualityValidator } from "../server/data-source/validation/quality-reporter";
import { ScenarioRunner } from "../server/data-source/demo/scenario-runner";
import { ExaminationDecisionEngine } from "../ai/decision/examination-decision-engine";

async function runDataAbstractionQualityTests() {
  console.log("==========================================================");
  console.log("Phase 6.5+ Data Quality & Abstraction Verification Suite");
  console.log("==========================================================");

  const dataSource = UniversityDataSourceFactory.getDataSource();

  // Test 1: DataQualityValidator Audit
  console.log("\n[Test 1] Executing DataQualityValidator on dataset...");
  const qualityReport = await DataQualityValidator.validateDataset(dataSource);

  assert(qualityReport.overallScore >= 95, `Overall quality score ${qualityReport.overallScore}% should be >= 95%`);
  assert(qualityReport.status === "HEALTHY", `Dataset status should be HEALTHY`);
  assert(qualityReport.domains.students.score >= 90, `Students domain score should be >= 90%`);
  assert(qualityReport.domains.attendance.score >= 90, `Attendance domain score should be >= 90%`);
  assert(qualityReport.decisionSafety.canRunExamEligibility === true, `Exam eligibility safety gate should be true`);
  console.log("  ✓ Test 1 Passed: Domain-level quality report & decision safety verified.");
  console.log(`    - Overall Score: ${qualityReport.overallScore}%`);
  console.log(`    - Status: ${qualityReport.status}`);
  console.log(`    - Decision Safety (canRunExamEligibility): ${qualityReport.decisionSafety.canRunExamEligibility}`);

  // Test 2: ScenarioRunner SCN-003 (Rahul Kumar Hard Attendance Block)
  console.log("\n[Test 2] Executing Scenario SCN-003 (Rahul Kumar Hard Attendance Block)...");
  const scn3Result = await ScenarioRunner.runScenario("SCN-003", dataSource);
  assert(scn3Result.scenario.id === "SCN-003", "Scenario ID should match SCN-003");
  assert(scn3Result.scenario.syntheticPersonaId === "STU-DEMO-00125", "Persona ID should be STU-DEMO-00125");
  assert(scn3Result.executionPreview.blockedCount === 1, "Blocked count should be 1");
  console.log("  ✓ Test 2 Passed: Deterministic SCN-003 scenario executed.");
  console.log(`    - Persona: ${scn3Result.scenario.syntheticPersonaName}`);
  console.log(`    - Expected Outcome: ${scn3Result.scenario.expectedOutcome}`);

  // Test 3: ScenarioRunner SCN-001 (Clean Eligible Student Action Plan)
  console.log("\n[Test 3] Executing Scenario SCN-001 (Clean Eligible Student Action Plan)...");
  const scn1Result = await ScenarioRunner.runScenario("SCN-001", dataSource);
  assert(scn1Result.scenario.id === "SCN-001", "Scenario ID should match SCN-001");
  assert(scn1Result.executionPreview.eligibleCount === 42, "Eligible count should be 42");
  assert(scn1Result.executionPreview.requiresHumanAuthorization === true, "Requires human authorization should be true");
  console.log("  ✓ Test 3 Passed: Action plan execution preview generated.");
  console.log(`    - Eligible Count: ${scn1Result.executionPreview.eligibleCount}`);
  console.log(`    - Conditional Count: ${scn1Result.executionPreview.conditionalCount}`);
  console.log(`    - Human Authorization Required: ${scn1Result.executionPreview.requiresHumanAuthorization}`);

  // Test 4: ExaminationDecisionEngine Provenance Quality Metadata
  console.log("\n[Test 4] Verifying Provenance Quality Metadata attachment...");
  const mockDecision = {
    examinationId: "exam_fall2026",
    studentId: "stu_001",
    status: "ELIGIBLE" as const,
    attendanceEligible: true,
    marksEligible: true,
    feeEligible: true,
    disciplinaryEligible: true,
    blockingReasons: [],
    policyReferences: [],
    recommendations: ["Issue Hall Ticket"],
    requiresApproval: false,
    evaluatedAt: new Date().toISOString(),
  };

  const decisionReport = ExaminationDecisionEngine.synthesizeDecision(
    mockDecision,
    "Ananya Sharma (Synthetic Persona)",
    "STU-DEMO-00101",
    []
  );

  const dbFact = decisionReport.provenance.find((p) => p.type === "DATABASE_FACT");
  assert(dbFact !== undefined, "DATABASE_FACT provenance item present");
  assert(dbFact?.qualityMetadata !== undefined, "qualityMetadata attached to DATABASE_FACT");
  assert(dbFact?.qualityMetadata?.datasetVersion === "demo-university-v1", "datasetVersion matches demo-university-v1");
  console.log("  ✓ Test 4 Passed: Provenance qualityMetadata attached.");

  console.log("\n==========================================================");
  console.log("ALL PHASE 6.5+ TESTS PASSED (4/4)");
  console.log("==========================================================");
}

runDataAbstractionQualityTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
