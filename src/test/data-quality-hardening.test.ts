import assert from "node:assert";
import { DataQualityValidator } from "../server/data-source/validation/quality-reporter";
import { UniversityDataSource } from "../server/data-source/university-data-source";

async function runDataQualityHardeningTests() {
  console.log("==========================================================");
  console.log("Phase 6.5+ Data Quality Hardening & Negative Testing Suite");
  console.log("==========================================================");

  // 1. Test SCN-DQ-001: Corrupted Attendance >100%
  console.log("\n[Test DQ-1] Auditing dataset with Attendance > 100%...");
  const mockCorruptedAttDs: UniversityDataSource = {
    mode: "demo",
    students: {
      findStudentById: async () => null,
      findProbationStudents: async () => [],
      listStudents: async () => [
        {
          id: "stu_bad_1",
          universityStudentId: "STU-CORRUPT-001",
          name: "Corrupted Student",
          email: "corrupt@demo.edu",
          departmentId: "dept_cs",
          departmentCode: "CSE",
          major: "Computer Science",
          gpa: 3.5,
          academicStatus: "GOOD_STANDING",
          organizationId: "org_demo",
        },
      ],
    },
    attendance: {
      getStudentAttendance: async (studentId) => ({
        id: `att_${studentId}`,
        studentId,
        totalClasses: 40,
        attendedClasses: 54,
        percentage: 135.0, // Invalid > 100%
        lastUpdated: new Date(),
        organizationId: "org_demo",
      }),
      getAttendanceShortfallStudents: async () => [],
    },
    examinations: {
      getExaminationById: async () => null,
      listExaminations: async () => [],
      getSchedules: async () => [],
      saveEligibility: async () => {},
      getEligibilityRoster: async () => [],
    },
    finance: {
      getStudentBalance: async () => null,
      getOutstandingBalances: async () => [],
    },
    faculty: { listFaculty: async () => [] },
    courses: { listCourses: async () => [], getCourseSections: async () => [] },
    results: { getStudentResults: async () => [] },
  };

  const dq1Report = await DataQualityValidator.validateDataset(mockCorruptedAttDs);
  assert(dq1Report.status === "CRITICAL", "Status should be CRITICAL when attendance > 100%");
  assert(dq1Report.decisionSafety.canRunExamEligibility === false, "canRunExamEligibility must be false when attendance > 100%");
  assert(dq1Report.issues.some((i) => i.severity === "CRITICAL" && i.domain === "attendance"), "CRITICAL issue logged for attendance");
  console.log("  ✓ Test DQ-1 Passed: Attendance > 100% correctly flagged CRITICAL and gated exam eligibility.");
  console.log(`    - Status: ${dq1Report.status}`);
  console.log(`    - canRunExamEligibility: ${dq1Report.decisionSafety.canRunExamEligibility}`);

  // 2. Test SCN-DQ-002: Duplicate Student Identity
  console.log("\n[Test DQ-2] Auditing dataset with Duplicate Student Identity...");
  const mockDupIdentityDs: UniversityDataSource = {
    mode: "demo",
    students: {
      findStudentById: async () => null,
      findProbationStudents: async () => [],
      listStudents: async () => [
        {
          id: "stu_dup_1",
          universityStudentId: "STU-DEMO-00101",
          name: "Student One",
          email: "one@demo.edu",
          departmentId: "dept_cs",
          departmentCode: "CSE",
          major: "Computer Science",
          gpa: 3.5,
          academicStatus: "GOOD_STANDING",
          organizationId: "org_demo",
        },
        {
          id: "stu_dup_2",
          universityStudentId: "STU-DEMO-00101", // Duplicate roll number
          name: "Student Two",
          email: "two@demo.edu",
          departmentId: "dept_cs",
          departmentCode: "CSE",
          major: "Computer Science",
          gpa: 3.2,
          academicStatus: "GOOD_STANDING",
          organizationId: "org_demo",
        },
      ],
    },
    attendance: { getStudentAttendance: async () => null, getAttendanceShortfallStudents: async () => [] },
    examinations: {
      getExaminationById: async () => null,
      listExaminations: async () => [],
      getSchedules: async () => [],
      saveEligibility: async () => {},
      getEligibilityRoster: async () => [],
    },
    finance: { getStudentBalance: async () => null, getOutstandingBalances: async () => [] },
    faculty: { listFaculty: async () => [] },
    courses: { listCourses: async () => [], getCourseSections: async () => [] },
    results: { getStudentResults: async () => [] },
  };

  const dq2Report = await DataQualityValidator.validateDataset(mockDupIdentityDs);
  assert(dq2Report.status === "CRITICAL", "Status should be CRITICAL on duplicate identity");
  assert(dq2Report.decisionSafety.canRunStudentRisk === false, "canRunStudentRisk must be false on duplicate identity");
  console.log("  ✓ Test DQ-2 Passed: Duplicate identity correctly flagged CRITICAL and gated student decisions.");

  // 3. Test SCN-DQ-003: Negative Fee Ledger
  console.log("\n[Test DQ-3] Auditing dataset with Negative Fee Ledger...");
  const mockNegFeeDs: UniversityDataSource = {
    mode: "demo",
    students: {
      findStudentById: async () => null,
      findProbationStudents: async () => [],
      listStudents: async () => [
        {
          id: "stu_fin_1",
          universityStudentId: "STU-FIN-001",
          name: "Finance Test",
          email: "fin@demo.edu",
          departmentId: "dept_cs",
          departmentCode: "CSE",
          major: "Computer Science",
          gpa: 3.0,
          academicStatus: "GOOD_STANDING",
          organizationId: "org_demo",
        },
      ],
    },
    attendance: { getStudentAttendance: async () => null, getAttendanceShortfallStudents: async () => [] },
    examinations: {
      getExaminationById: async () => null,
      listExaminations: async () => [],
      getSchedules: async () => [],
      saveEligibility: async () => {},
      getEligibilityRoster: async () => [],
    },
    finance: {
      getStudentBalance: async (studentId) => ({
        id: `fin_${studentId}`,
        studentId,
        totalBilled: -5000, // Invalid negative billing
        totalPaid: -1000,
        balanceOutstanding: -4000,
        status: "OVERDUE",
        organizationId: "org_demo",
      }),
      getOutstandingBalances: async () => [],
    },
    faculty: { listFaculty: async () => [] },
    courses: { listCourses: async () => [], getCourseSections: async () => [] },
    results: { getStudentResults: async () => [] },
  };

  const dq3Report = await DataQualityValidator.validateDataset(mockNegFeeDs);
  assert(dq3Report.status === "CRITICAL", "Status should be CRITICAL on negative fee ledger");
  assert(dq3Report.decisionSafety.canRunFinancialDecision === false, "canRunFinancialDecision must be false");
  console.log("  ✓ Test DQ-3 Passed: Negative fee ledger correctly flagged CRITICAL.");

  // 4. Test SCN-DQ-004: Non-critical missing email (WARNING)
  console.log("\n[Test DQ-4] Auditing dataset with Non-critical missing email (WARNING)...");
  const mockWarnDs: UniversityDataSource = {
    mode: "demo",
    students: {
      findStudentById: async () => null,
      findProbationStudents: async () => [],
      listStudents: async () => [
        {
          id: "stu_opt_1",
          universityStudentId: "STU-OPT-001",
          name: "Optional Email Student",
          email: "", // Missing email, non-critical
          departmentId: "dept_cs",
          departmentCode: "CSE",
          major: "Computer Science",
          gpa: 3.8,
          academicStatus: "GOOD_STANDING",
          organizationId: "org_demo",
        },
      ],
    },
    attendance: { getStudentAttendance: async () => null, getAttendanceShortfallStudents: async () => [] },
    examinations: {
      getExaminationById: async () => null,
      listExaminations: async () => [],
      getSchedules: async () => [],
      saveEligibility: async () => {},
      getEligibilityRoster: async () => [],
    },
    finance: { getStudentBalance: async () => null, getOutstandingBalances: async () => [] },
    faculty: { listFaculty: async () => [] },
    courses: { listCourses: async () => [], getCourseSections: async () => [] },
    results: { getStudentResults: async () => [] },
  };

  const dq4Report = await DataQualityValidator.validateDataset(mockWarnDs);
  assert(dq4Report.status === "WARNING", "Status should be WARNING for missing email");
  assert(dq4Report.decisionSafety.canRunExamEligibility === true, "canRunExamEligibility remains true for WARNING");
  console.log("  ✓ Test DQ-4 Passed: Missing email correctly classified as WARNING while preserving safety gates.");

  console.log("\n==========================================================");
  console.log("ALL DATA QUALITY HARDENING TESTS PASSED (4/4)");
  console.log("==========================================================");
}

runDataQualityHardeningTests().catch((err) => {
  console.error("Data Quality Hardening Suite Failed:", err);
  process.exit(1);
});
