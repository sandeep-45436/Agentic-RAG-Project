import { UniversityDataSourceFactory } from "../server/data-source/data-source-factory";
import { DemoDataSource } from "../server/data-source/demo/demo-data-source";
import { PostgresDataSource } from "../server/data-source/postgres/postgres-data-source";
import { ApiDataSource } from "../server/data-source/api/university-api-data-source";
import { HallTicketEngine } from "../ai/examination/hall-ticket-engine";
import { ExaminationDecisionEngine } from "../ai/decision/examination-decision-engine";

async function runPhase65Tests() {
  console.log("=================================================");
  console.log("🧪 RUNNING PHASE 6.5 DATA ABSTRACTION TEST SUITE");
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

  // --- Test 1: Data Source Factory - Default Demo Mode ---
  UniversityDataSourceFactory.reset();
  process.env.UNIVERSITY_DATA_SOURCE = "demo";
  const demoDs = UniversityDataSourceFactory.getDataSource();
  assert(demoDs.mode === "demo", "Test 1a: Factory resolves DemoDataSource when env='demo'");
  assert(demoDs instanceof DemoDataSource, "Test 1b: Factory returns DemoDataSource instance");

  // --- Test 2: Data Source Factory - Postgres Mode ---
  UniversityDataSourceFactory.reset();
  process.env.UNIVERSITY_DATA_SOURCE = "postgres";
  const pgDs = UniversityDataSourceFactory.getDataSource();
  assert(pgDs.mode === "postgres", "Test 2a: Factory resolves PostgresDataSource when env='postgres'");
  assert(pgDs instanceof PostgresDataSource, "Test 2b: Factory returns PostgresDataSource instance");

  // --- Test 3: Data Source Factory - API Mode ---
  UniversityDataSourceFactory.reset();
  process.env.UNIVERSITY_DATA_SOURCE = "api";
  const apiDs = UniversityDataSourceFactory.getDataSource();
  assert(apiDs.mode === "api", "Test 3a: Factory resolves ApiDataSource when env='api'");
  assert(apiDs instanceof ApiDataSource, "Test 3b: Factory returns ApiDataSource instance");

  // --- Test 4: Canonical Model Normalization across Adapters ---
  UniversityDataSourceFactory.setDataSource(new DemoDataSource());
  const ds = UniversityDataSourceFactory.getDataSource();

  const student = await ds.students.findStudentById("stu_001", "org_demo");
  assert(student !== null, "Test 4a: Demo student resolved successfully");
  assert(student?.universityStudentId === "STU-DEMO-00101", "Test 4b: Canonical universityStudentId normalized");

  const attendance = await ds.attendance.getStudentAttendance("stu_001", "org_demo");
  assert(attendance !== null, "Test 4c: Demo attendance resolved successfully");
  assert(attendance?.percentage === 90.0, "Test 4d: Canonical percentage computed");

  const finance = await ds.finance.getStudentBalance("stu_001", "org_demo");
  assert(finance !== null, "Test 4e: Demo finance balance resolved successfully");
  assert(finance?.balanceOutstanding === 0, "Test 4f: Canonical finance balance normalized");

  // --- Test 5: Decoupled Decision Engine Execution across Data Sources ---
  // HallTicketEngine executes identically regardless of whether data came from Demo, Postgres, or API!
  const profile = {
    studentId: student!.id,
    studentNumber: student!.universityStudentId,
    name: student!.name,
    academicStatus: student!.academicStatus,
    attendancePercentage: attendance!.percentage,
    outstandingBalance: finance!.balanceOutstanding,
    internalMarksComplete: true,
  };

  const decision = HallTicketEngine.evaluateEligibility(profile, "exam_demo_fall");
  assert(decision.status === "ELIGIBLE", "Test 5a: HallTicketEngine operates seamlessly over Canonical Data Model");

  const report = ExaminationDecisionEngine.synthesizeDecision(decision, student!.name, student!.universityStudentId, []);
  assert(report.decision === "ELIGIBLE", "Test 5b: ExaminationDecisionEngine operates seamlessly over Canonical Data Model");

  console.log("\n=================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase65Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
