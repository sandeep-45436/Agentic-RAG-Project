import { HallTicketEngine, StudentExaminationProfile } from "../ai/examination/hall-ticket-engine";
import { ExaminationDecisionEngine } from "../ai/decision/examination-decision-engine";
import { ExaminationSchedulingEngine, ScheduleItem } from "../ai/examination/examination-scheduling-engine";
import { InvigilationEngine, FacultyCandidate } from "../ai/examination/invigilation-engine";
import { Citation } from "../server/services/citation.service";

async function runPhase6Tests() {
  console.log("=================================================");
  console.log("🧪 RUNNING PHASE 6 EXAMINATION OPERATIONS TEST SUITE");
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

  // --- Test 1: HallTicketEngine - Fully Eligible Student ---
  const eligibleStudent: StudentExaminationProfile = {
    studentId: "stu_001",
    studentNumber: "STU2026001",
    name: "Alice Smith",
    academicStatus: "Good Standing",
    attendancePercentage: 88.5,
    outstandingBalance: 0,
    internalMarksComplete: true,
  };
  const decision1 = HallTicketEngine.evaluateEligibility(eligibleStudent, "exam_2026_fall");
  assert(decision1.status === "ELIGIBLE", "Test 1a: Fully compliant student gets ELIGIBLE status");
  assert(decision1.blockingReasons.length === 0, "Test 1b: No blocking reasons for eligible student");
  assert(decision1.requiresApproval === false, "Test 1c: No human approval needed for eligible student");

  // --- Test 2: HallTicketEngine - Attendance Shortfall (< 75%) ---
  const lowAttendanceStudent: StudentExaminationProfile = {
    studentId: "stu_002",
    studentNumber: "STU2026002",
    name: "Bob Johnson",
    academicStatus: "Good Standing",
    attendancePercentage: 58.0,
    outstandingBalance: 0,
    internalMarksComplete: true,
  };
  const decision2 = HallTicketEngine.evaluateEligibility(lowAttendanceStudent, "exam_2026_fall");
  assert(decision2.status === "BLOCKED", "Test 2a: Attendance < 65% results in BLOCKED status");
  assert(decision2.attendanceEligible === false, "Test 2b: attendanceEligible is false");
  assert(decision2.blockingReasons.some((r) => r.code === "ATTENDANCE"), "Test 2c: Structured ATTENDANCE blocking reason present");

  // --- Test 3: HallTicketEngine - Conditional Eligibility (65% - 75%) ---
  const borderAttendanceStudent: StudentExaminationProfile = {
    studentId: "stu_003",
    studentNumber: "STU2026003",
    name: "Charlie Brown",
    academicStatus: "Good Standing",
    attendancePercentage: 68.4,
    outstandingBalance: 0,
    internalMarksComplete: true,
  };
  const decision3 = HallTicketEngine.evaluateEligibility(borderAttendanceStudent, "exam_2026_fall");
  assert(decision3.status === "CONDITIONAL", "Test 3a: Attendance between 65% and 75% results in CONDITIONAL status");
  assert(decision3.requiresApproval === true, "Test 3b: Conditional status sets requiresApproval=true");

  // --- Test 4: HallTicketEngine - Tuition Fee Hold ---
  const feeHoldStudent: StudentExaminationProfile = {
    studentId: "stu_004",
    studentNumber: "STU2026004",
    name: "Diana Prince",
    academicStatus: "Good Standing",
    attendancePercentage: 92.0,
    outstandingBalance: 4500.0,
    internalMarksComplete: true,
  };
  const decision4 = HallTicketEngine.evaluateEligibility(feeHoldStudent, "exam_2026_fall");
  assert(decision4.status === "BLOCKED", "Test 4a: Outstanding tuition balance causes BLOCKED status");
  assert(decision4.feeEligible === false, "Test 4b: feeEligible is false");
  assert(decision4.blockingReasons.some((r) => r.code === "FEE_HOLD"), "Test 4c: Structured FEE_HOLD blocking reason present");

  // --- Test 5: HallTicketEngine - Academic Probation (Requires Approval) ---
  const probationStudent: StudentExaminationProfile = {
    studentId: "stu_005",
    studentNumber: "STU2026005",
    name: "Evan Wright",
    academicStatus: "Academic Probation",
    attendancePercentage: 82.0,
    outstandingBalance: 0,
    internalMarksComplete: true,
  };
  const decision5 = HallTicketEngine.evaluateEligibility(probationStudent, "exam_2026_fall");
  assert(decision5.status === "REQUIRES_APPROVAL", "Test 5a: Probation status results in REQUIRES_APPROVAL");
  assert(decision5.requiresApproval === true, "Test 5b: Probation triggers human approval flag");

  // --- Test 6: ExaminationDecisionEngine - Provenance & Synthesis ---
  const mockCitations: Citation[] = [
    {
      citationId: "Citation 1",
      id: 1,
      documentId: "doc_policy_01",
      documentName: "Academic_Handbook_2026.pdf",
      documentVersion: 3,
      chunkId: "chk_001",
      chunkIndex: 4,
      pageNumber: 42,
      sectionHeader: "Attendance Regulation 4.2",
      organizationId: "org_test",
      confidence: 0.95,
      retrievalMethod: "hybrid",
      content: "Students must maintain a minimum attendance of 75% to qualify for semester examinations.",
    },
  ];

  const synthesisReport = ExaminationDecisionEngine.synthesizeDecision(
    decision2,
    lowAttendanceStudent.name,
    lowAttendanceStudent.studentNumber,
    mockCitations
  );

  assert(synthesisReport.decision === "INELIGIBLE", "Test 6a: Decision state synthesized properly");
  assert(synthesisReport.provenance.some((p) => p.type === "DATABASE_FACT"), "Test 6b: DATABASE_FACT provenance item present");
  assert(synthesisReport.provenance.some((p) => p.type === "DOCUMENT_FACT"), "Test 6c: DOCUMENT_FACT provenance item present");
  assert(synthesisReport.provenance.some((p) => p.type === "DERIVED_DECISION"), "Test 6d: DERIVED_DECISION provenance item present");
  assert(synthesisReport.provenance.some((p) => p.type === "RECOMMENDATION"), "Test 6e: RECOMMENDATION provenance item present");

  // --- Test 7: ExaminationSchedulingEngine - Room Double-Booking ---
  const testSchedules: ScheduleItem[] = [
    {
      id: "sch_101",
      courseSectionId: "sec_cs101",
      courseName: "CSE101 Programming",
      examDate: "2026-11-15",
      startTime: "09:00",
      endTime: "11:00",
      roomId: "room_auditorium",
      roomName: "Main Auditorium",
      roomCapacity: 100,
      enrolledStudentIds: ["stu_001", "stu_002"],
    },
    {
      id: "sch_102",
      courseSectionId: "sec_math201",
      courseName: "MATH201 Calculus",
      examDate: "2026-11-15",
      startTime: "10:00",
      endTime: "12:00",
      roomId: "room_auditorium",
      roomName: "Main Auditorium",
      roomCapacity: 100,
      enrolledStudentIds: ["stu_003", "stu_004"],
    },
  ];

  const conflicts1 = ExaminationSchedulingEngine.detectConflicts(testSchedules);
  assert(conflicts1.some((c) => c.type === "ROOM_CLASH"), "Test 7a: Detected ROOM_CLASH double booking conflict");
  assert(conflicts1.some((c) => c.severity === "CRITICAL"), "Test 7b: Double-booking flagged as CRITICAL severity");

  // --- Test 8: ExaminationSchedulingEngine - Room Capacity Breach ---
  const overCapacitySchedules: ScheduleItem[] = [
    {
      id: "sch_103",
      courseSectionId: "sec_cs301",
      courseName: "CSE301 Operating Systems",
      examDate: "2026-11-16",
      startTime: "14:00",
      endTime: "16:00",
      roomId: "room_lab_101",
      roomName: "Computer Lab 101",
      roomCapacity: 2, // Low capacity for testing
      enrolledStudentIds: ["stu_001", "stu_002", "stu_003", "stu_004", "stu_005"], // 5 students > 2 capacity
    },
  ];

  const conflicts2 = ExaminationSchedulingEngine.detectConflicts(overCapacitySchedules);
  assert(conflicts2.some((c) => c.type === "ROOM_CAPACITY"), "Test 8a: Detected ROOM_CAPACITY violation");

  // --- Test 9: InvigilationEngine - Optimization & Hard Constraints ---
  const facultyList: FacultyCandidate[] = [
    { facultyId: "fac_001", name: "Dr. Alan Turing", departmentId: "dept_cs", departmentCode: "CSE", currentDutiesCount: 3, isAvailable: true },
    { facultyId: "fac_002", name: "Dr. Grace Hopper", departmentId: "dept_cs", departmentCode: "CSE", currentDutiesCount: 0, isAvailable: true },
    { facultyId: "fac_003", name: "Dr. Ada Lovelace", departmentId: "dept_math", departmentCode: "MATH", currentDutiesCount: 1, isAvailable: false }, // Unavailable
  ];

  const invigilationReport = InvigilationEngine.optimizeInvigilation(testSchedules, facultyList);
  assert(invigilationReport.assignedSchedules === 2, "Test 9a: InvigilationEngine assigned all schedules");
  assert(invigilationReport.assignments.some((a) => a.assignedFacultyId === "fac_002"), "Test 9b: Assigned faculty with lowest workload (Dr. Hopper)");
  assert(!invigilationReport.assignments.some((a) => a.assignedFacultyId === "fac_003"), "Test 9c: Respected hard constraint (unavailable faculty not assigned)");
  assert(invigilationReport.workloadDistributionScore >= 0.50, "Test 9d: Computed valid workload distribution score");

  // --- Test 10: Full Multi-Step Acceptance Query Execution Scenario ---
  console.log("\n--- Testing Acceptance Scenario ---");
  const acceptanceStudentProfiles: StudentExaminationProfile[] = [eligibleStudent, lowAttendanceStudent, borderAttendanceStudent, feeHoldStudent, probationStudent];
  const acceptanceDecisions = acceptanceStudentProfiles.map((p) => HallTicketEngine.evaluateEligibility(p, "exam_2026_fall"));
  
  const blockedCount = acceptanceDecisions.filter((d) => d.status === "BLOCKED").length;
  const approvalRequiredCount = acceptanceDecisions.filter((d) => d.requiresApproval).length;

  assert(blockedCount === 2, "Test 10a: Correctly identified 2 BLOCKED students (low attendance + fee hold)");
  assert(approvalRequiredCount === 2, "Test 10b: Correctly identified 2 approval-required cases (conditional + probation)");

  console.log("\n=================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
