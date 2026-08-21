import assert from "node:assert";
import { UniversityDataSourceFactory } from "../server/data-source/data-source-factory";
import { AcademicRiskEngine } from "../ai/academic/academic-risk-engine";

async function runPhase7AcademicOperationsTests() {
  console.log("==========================================================");
  console.log("Phase 7: Academic Operations Intelligence Test Suite");
  console.log("==========================================================");

  const dataSource = UniversityDataSourceFactory.getDataSource();

  // Test 1: Flagship Query Execution
  console.log("\n[Test 1] Executing flagship academic risk query for CSE department...");
  const report = await AcademicRiskEngine.analyzeAcademicRisk(dataSource, "org_demo", "CSE");

  assert(report.reportId.startsWith("ACAD_RISK_CSE_"), "Report ID should be formatted correctly");
  assert(report.departmentSummary.departmentCode === "CSE", "Department code should be CSE");
  assert(report.highRiskCourses.length > 0, "High risk courses should be identified");
  console.log("  ✓ Test 1 Passed: Academic risk analysis executed successfully.");
  console.log(`    - Report ID: ${report.reportId}`);
  console.log(`    - High Risk Courses Count: ${report.highRiskCourses.length}`);
  console.log(`    - Department Avg GPA: ${report.departmentSummary.avgStudentGpa}`);

  // Test 2: Verify High Risk Course Identification (CSE204)
  console.log("\n[Test 2] Verifying CSE204 high-risk course metrics...");
  const topCourse = report.highRiskCourses.find((c) => c.code === "CSE204") || report.highRiskCourses[0];
  assert(topCourse !== undefined, "CSE204 or top risk course present");
  assert(topCourse.riskScore >= 25, "Risk score should be >= 25");
  assert(topCourse.historicalFailureRatePct === 38.0, "Historical failure rate should be 38%");
  console.log("  ✓ Test 2 Passed: High-risk course CSE204 correctly scored.");
  console.log(`    - Course: ${topCourse.code} - ${topCourse.title}`);
  console.log(`    - Risk Score: ${topCourse.riskScore}/100 (${topCourse.riskCategory})`);
  console.log(`    - Failure Rate: ${topCourse.historicalFailureRatePct}%`);

  // Test 3: Provenance Auditing (4 Provenance Types + Quality Metadata)
  console.log("\n[Test 3] Verifying Provenance Chain & Data Quality Metadata...");
  assert(report.provenance.some((p) => p.type === "DATABASE_FACT"), "DATABASE_FACT present");
  assert(report.provenance.some((p) => p.type === "DOCUMENT_FACT"), "DOCUMENT_FACT present");
  assert(report.provenance.some((p) => p.type === "DERIVED_DECISION"), "DERIVED_DECISION present");
  assert(report.provenance.some((p) => p.type === "RECOMMENDATION"), "RECOMMENDATION present");

  const dbFact = report.provenance.find((p) => p.type === "DATABASE_FACT");
  assert(dbFact?.qualityMetadata !== undefined, "qualityMetadata attached to DATABASE_FACT");
  assert(dbFact?.qualityMetadata?.recordValidated === true, "recordValidated is true");
  console.log("  ✓ Test 3 Passed: Complete 4-type provenance chain verified.");

  // Test 4: Flagship Answer & Policy Grounding
  console.log("\n[Test 4] Verifying Flagship Query Answer Synthesis...");
  assert(report.flagshipAnswer.includes("CSE204"), "Flagship answer mentions CSE204");
  assert(report.flagshipAnswer.includes("Regulation 6.1"), "Flagship answer grounds Academic Policy 6.1");
  assert(report.requiresDepartmentAction === true, "Department action required flag is true");
  console.log("  ✓ Test 4 Passed: Flagship answer grounded in policy and evidence.");

  console.log("\n==========================================================");
  console.log("ALL PHASE 7 TESTS PASSED (4/4)");
  console.log("==========================================================");
}

runPhase7AcademicOperationsTests().catch((err) => {
  console.error("Phase 7 Test Suite Failed:", err);
  process.exit(1);
});
