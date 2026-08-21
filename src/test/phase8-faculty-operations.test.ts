import assert from "node:assert";
import { UniversityDataSourceFactory } from "../server/data-source/data-source-factory";
import { WorkloadEngine } from "../ai/faculty/workload-engine";
import { AllocationEngine } from "../ai/faculty/allocation-engine";
import { FacultyConflictEngine } from "../ai/faculty/faculty-conflict-engine";
import { FacultyOperationsEngine } from "../ai/faculty/faculty-operations-engine";
import { ScenarioRunner } from "../server/data-source/demo/scenario-runner";

async function runPhase8FacultyOperationsTests() {
  console.log("==========================================================");
  console.log("Phase 8: Faculty Operations Intelligence Test Suite");
  console.log("==========================================================");

  const dataSource = UniversityDataSourceFactory.getDataSource();

  // Test 1: WorkloadEngine Calculation & Auditable Breakdown
  console.log("\n[Test 1] Executing WorkloadEngine on Dr. Rajesh Iyer...");
  const iyWorkload = WorkloadEngine.calculateWorkload({
    facultyId: "fac_001",
    facultyName: "Dr. Rajesh Iyer",
    departmentCode: "CSE",
    teachingHours: 18,
    enrolledStudents: 186,
    invigilationDuties: 6,
    researchProjects: 2,
    administrativeRoles: 2,
  });

  assert(iyWorkload.workloadScore === 87, `Workload score should be 87 (actual: ${iyWorkload.workloadScore})`);
  assert(iyWorkload.status === "OVERLOADED", "Status should be OVERLOADED");
  assert(iyWorkload.breakdown.teachingScore === 34, "Teaching score should be 34");
  assert(iyWorkload.breakdown.studentLoadScore === 19, "Student load score should be 19");
  assert(iyWorkload.breakdown.invigilationScore === 14, "Invigilation score should be 14");
  assert(iyWorkload.primaryCauses.length >= 3, "Primary causes count should be >= 3");
  console.log("  ✓ Test 1 Passed: Auditable workload score 87/100 verified.");
  console.log(`    - Status: ${iyWorkload.status}`);
  console.log(`    - Causes: ${iyWorkload.primaryCauses.join(", ")}`);

  // Test 2: AllocationEngine Candidate Ranking & Human Approval Gate
  console.log("\n[Test 2] Executing AllocationEngine candidate ranking for CSE204...");
  const facultyList = await dataSource.faculty.listFaculty("org_demo", "CSE");
  const workloadMap = new Map([
    ["fac_001", iyWorkload],
    [
      "fac_002",
      WorkloadEngine.calculateWorkload({
        facultyId: "fac_002",
        facultyName: "Dr. Priya Sharma",
        departmentCode: "CSE",
        teachingHours: 12,
        enrolledStudents: 80,
        invigilationDuties: 2,
        researchProjects: 1,
        administrativeRoles: 0,
      }),
    ],
  ]);

  const proposal = AllocationEngine.evaluateCandidates("CSE204", "Data Structures", "CSE", facultyList, workloadMap);

  assert(proposal.requiresHumanApproval === true, "Requires human approval must be true");
  assert(proposal.recommendedCandidate !== null, "Recommended candidate should be present");
  assert(proposal.recommendedCandidate?.facultyName.includes("Priya Sharma") || proposal.recommendedCandidate?.compositeScore >= 80, "Top candidate should be qualified");
  console.log("  ✓ Test 2 Passed: Candidate allocation ranking & Action Proposal Gating verified.");
  console.log(`    - Top Candidate: ${proposal.executionPreview.topCandidateName}`);
  console.log(`    - Action Proposal: ${proposal.executionPreview.recommendedAction}`);

  // Test 3: AllocationEngine "No Suitable Candidate" Edge Case
  console.log("\n[Test 3] Testing AllocationEngine 'No Qualified Candidate' handling...");
  const overloadedMap = new Map([
    ["fac_001", iyWorkload],
    [
      "fac_002",
      WorkloadEngine.calculateWorkload({
        facultyId: "fac_002",
        facultyName: "Dr. Priya Sharma",
        departmentCode: "CSE",
        teachingHours: 18,
        enrolledStudents: 180,
        invigilationDuties: 6,
        researchProjects: 3,
        administrativeRoles: 2,
      }),
    ],
  ]);

  const noCandProp = AllocationEngine.evaluateCandidates("CSE204", "Data Structures", "CSE", facultyList, overloadedMap);
  assert(noCandProp.executionPreview.status === "NO_QUALIFIED_CANDIDATES", "Status should be NO_QUALIFIED_CANDIDATES");
  assert(noCandProp.recommendedCandidate === null, "Recommended candidate should be null");
  console.log("  ✓ Test 3 Passed: 'No Qualified Candidate' edge case handled cleanly.");

  // Test 4: FacultyConflictEngine Detection
  console.log("\n[Test 4] Executing FacultyConflictEngine for timetable clashes & invigilation overload...");
  const conflictReport = FacultyConflictEngine.detectConflicts(
    "CSE",
    facultyList,
    new Map([["fac_001", 6]]),
    new Map([["fac_002", ["10:00 AM (Room A101 / B204)"]]])
  );

  assert(conflictReport.totalConflicts === 2, `Total conflicts should be 2 (actual: ${conflictReport.totalConflicts})`);
  assert(conflictReport.criticalConflictsCount >= 1, "Critical conflicts count should be >= 1");
  console.log("  ✓ Test 4 Passed: Timetable clashes & invigilation overload detected.");
  console.log(`    - Total Conflicts: ${conflictReport.totalConflicts}`);

  // Test 5: Flagship Operational Query Synthesis & Provenance Verification
  console.log("\n[Test 5] Executing FacultyOperationsEngine Flagship Query...");
  const opsReport = await FacultyOperationsEngine.analyzeFacultyOperations(dataSource, "org_demo", "CSE");

  assert(opsReport.flagshipAnswer.includes("Dr. Rajesh Iyer"), "Flagship answer includes Dr. Rajesh Iyer");
  assert(opsReport.flagshipAnswer.includes("APPROVAL GATE"), "Flagship answer includes APPROVAL GATE citation");
  assert(opsReport.provenance.some((p) => p.type === "DATABASE_FACT"), "DATABASE_FACT present");
  assert(opsReport.provenance.some((p) => p.type === "DOCUMENT_FACT"), "DOCUMENT_FACT present");
  assert(opsReport.provenance.some((p) => p.type === "DERIVED_DECISION"), "DERIVED_DECISION present");
  assert(opsReport.provenance.some((p) => p.type === "RECOMMENDATION"), "RECOMMENDATION present");
  console.log("  ✓ Test 5 Passed: Flagship Operational Query synthesized with complete provenance.");

  // Test 6: Deterministic Scenario Execution (SCN-FAC-001)
  console.log("\n[Test 6] Executing Deterministic Scenario SCN-FAC-001...");
  const scnFac1 = await ScenarioRunner.runScenario("SCN-FAC-001", dataSource);
  assert(scnFac1.scenario.id === "SCN-FAC-001", "Scenario ID should match SCN-FAC-001");
  assert(scnFac1.scenario.syntheticPersonaId === "FAC-DEMO-001", "Persona ID should be FAC-DEMO-001");
  console.log("  ✓ Test 6 Passed: Deterministic Scenario SCN-FAC-001 verified.");

  console.log("\n==========================================================");
  console.log("ALL PHASE 8 TESTS PASSED (6/6)");
  console.log("==========================================================");
}

runPhase8FacultyOperationsTests().catch((err) => {
  console.error("Phase 8 Test Suite Failed:", err);
  process.exit(1);
});
