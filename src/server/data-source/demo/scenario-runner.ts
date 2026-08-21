import { UniversityDataSource } from "../university-data-source";
import { DataQualityValidator, DataQualityReport } from "../validation/quality-reporter";

export type DemoScenarioId =
  | "SCN-001" // Clean Eligible Student
  | "SCN-002" // Conditional Attendance (65-75%)
  | "SCN-003" // Hard Attendance Block (<65%)
  | "SCN-004" // Fee Default Block
  | "SCN-005" // Academic Probation & Declining GPA
  | "SCN-006" // GPA Recovery Case
  | "SCN-007" // Multiple Backlogs
  | "SCN-008" // Scholarship Merit Candidate
  | "SCN-009" // Hostel Edge Case
  | "SCN-010" // Exam Room Conflict
  | "SCN-011" // Faculty Workload Imbalance
  | "SCN-012" // High-Risk Course Warning
  | "SCN-013" // Incomplete Metadata (Data Quality Test)
  | "SCN-014" // Placement Eligible Senior
  | "SCN-015" // Research Grant Applicant
  | "SCN-FAC-001" // Overloaded Faculty
  | "SCN-FAC-002" // Timetable Conflict
  | "SCN-FAC-003" // Invigilation Overload
  | "SCN-FAC-004" // Qualified Replacement Available
  | "SCN-FAC-005" // No Suitable Replacement
  | "SCN-FAC-006"; // Policy-Limited Redistribution

export interface DemoScenarioDefinition {
  id: DemoScenarioId;
  name: string;
  category: "Student" | "Examination" | "Academic" | "Finance" | "Faculty" | "Research";
  description: string;
  syntheticPersonaId: string;
  syntheticPersonaName: string;
  expectedOutcome: string;
  metrics: Record<string, any>;
}

export interface ScenarioRunResult {
  scenario: DemoScenarioDefinition;
  datasetVersion: "demo-university-v1";
  qualityReport: DataQualityReport;
  executionPreview: {
    eligibleCount: number;
    conditionalCount: number;
    blockedCount: number;
    requiresHumanAuthorization: boolean;
  };
  details: Record<string, any>;
}

export const DEMO_SCENARIOS: Record<DemoScenarioId, DemoScenarioDefinition> = {
  "SCN-001": {
    id: "SCN-001",
    name: "Clean Eligible Student",
    category: "Examination",
    description: "Student with 92% attendance, 0 fee due, and 3.8 GPA.",
    syntheticPersonaId: "STU-DEMO-00101",
    syntheticPersonaName: "Ananya Sharma (Synthetic Persona)",
    expectedOutcome: "Eligible for automatic Hall Ticket issuance.",
    metrics: { attendancePct: 92, feeDue: 0, gpa: 3.8 },
  },
  "SCN-002": {
    id: "SCN-002",
    name: "Conditional Attendance (65–75%)",
    category: "Examination",
    description: "Student with 68% attendance seeking medical condonation review.",
    syntheticPersonaId: "STU-DEMO-00102",
    syntheticPersonaName: "Vikram Singh (Synthetic Persona)",
    expectedOutcome: "Held for Human Authorization & Condonation Review.",
    metrics: { attendancePct: 68, feeDue: 0, gpa: 3.1 },
  },
  "SCN-003": {
    id: "SCN-003",
    name: "Hard Attendance Block (<65%)",
    category: "Examination",
    description: "Student Rahul Kumar with 58% attendance and severe shortfall.",
    syntheticPersonaId: "STU-DEMO-00125",
    syntheticPersonaName: "Rahul Kumar (Synthetic Persona)",
    expectedOutcome: "Hard Blocked from Hall Ticket generation per Section 4.2 policy.",
    metrics: { attendancePct: 58, feeDue: 5000, gpa: 2.4, backlogs: 2 },
  },
  "SCN-004": {
    id: "SCN-004",
    name: "Fee Default Block",
    category: "Finance",
    description: "Student with 88% attendance but $1,200 overdue tuition fee balance.",
    syntheticPersonaId: "STU-DEMO-00104",
    syntheticPersonaName: "Priya Patel (Synthetic Persona)",
    expectedOutcome: "Blocked due to financial hold until fee clearance.",
    metrics: { attendancePct: 88, feeDue: 1200, gpa: 3.5 },
  },
  "SCN-005": {
    id: "SCN-005",
    name: "Academic Probation & Declining GPA",
    category: "Academic",
    description: "Student on academic probation with GPA 1.85.",
    syntheticPersonaId: "STU-DEMO-00105",
    syntheticPersonaName: "Karan Mehta (Synthetic Persona)",
    expectedOutcome: "Flagged for mandatory Academic Advising intervention.",
    metrics: { gpa: 1.85, status: "PROBATION" },
  },
  "SCN-006": {
    id: "SCN-006",
    name: "GPA Recovery Candidate",
    category: "Academic",
    description: "Student who improved GPA from 1.90 to 2.40 over recent semester.",
    syntheticPersonaId: "STU-DEMO-00106",
    syntheticPersonaName: "Neha Verma (Synthetic Persona)",
    expectedOutcome: "Probation status update to Good Standing pending review.",
    metrics: { previousGpa: 1.9, currentGpa: 2.4 },
  },
  "SCN-007": {
    id: "SCN-007",
    name: "Multiple Backlogs Case",
    category: "Examination",
    description: "Student with 4 active backlog examinations.",
    syntheticPersonaId: "STU-DEMO-00107",
    syntheticPersonaName: "Rohan Gupta (Synthetic Persona)",
    expectedOutcome: "Special backlog examination timetable generated.",
    metrics: { activeBacklogs: 4 },
  },
  "SCN-008": {
    id: "SCN-008",
    name: "Scholarship Merit Candidate",
    category: "Student",
    description: "Top performer with 3.95 GPA eligible for Dean's Excellence Scholarship.",
    syntheticPersonaId: "STU-DEMO-00108",
    syntheticPersonaName: "Sneha Nair (Synthetic Persona)",
    expectedOutcome: "Merit scholarship grant recommendation generated.",
    metrics: { gpa: 3.95, attendancePct: 98 },
  },
  "SCN-009": {
    id: "SCN-009",
    name: "Hostel Edge Case",
    category: "Student",
    description: "Outstation student requesting priority hostel allotment.",
    syntheticPersonaId: "STU-DEMO-00109",
    syntheticPersonaName: "Arjun Reddy (Synthetic Persona)",
    expectedOutcome: "Hostel allocation approved under distance quota.",
    metrics: { distanceKm: 450, priorityScore: 92 },
  },
  "SCN-010": {
    id: "SCN-010",
    name: "Exam Room Conflict",
    category: "Examination",
    description: "Two major exam sessions scheduled for Hall B at same time.",
    syntheticPersonaId: "SCHED-EXAM-010",
    syntheticPersonaName: "CSE301 & ECE302 Timetable Overlap",
    expectedOutcome: "Planner Agent re-allocates Hall C with zero conflict.",
    metrics: { conflictType: "ROOM_DOUBLE_BOOKING" },
  },
  "SCN-011": {
    id: "SCN-011",
    name: "Faculty Workload Imbalance",
    category: "Faculty",
    description: "Professor assigned 6 invigilation slots in 3 consecutive days.",
    syntheticPersonaId: "FAC-DEMO-001",
    syntheticPersonaName: "Dr. Rajesh Iyer (Faculty Persona)",
    expectedOutcome: "Invigilation re-balanced across department faculty roster.",
    metrics: { assignedSlots: 6, maxThreshold: 4 },
  },
  "SCN-012": {
    id: "SCN-012",
    name: "High-Risk Course Warning",
    category: "Academic",
    description: "Course CSE204 with historical failure rate of 38%.",
    syntheticPersonaId: "CRS-DEMO-204",
    syntheticPersonaName: "Data Structures & Algorithms (CSE204)",
    expectedOutcome: "Tutoring support & remedial class recommendation triggered.",
    metrics: { failRatePct: 38 },
  },
  "SCN-013": {
    id: "SCN-013",
    name: "Incomplete Metadata (Data Quality Test)",
    category: "Academic",
    description: "Record with missing department code to test Data Quality Gate.",
    syntheticPersonaId: "STU-DEMO-00113",
    syntheticPersonaName: "Test Record (Data Quality Audit)",
    expectedOutcome: "Captured by Data Quality Validator as WARNING/ERROR.",
    metrics: { missingField: "departmentCode" },
  },
  "SCN-014": {
    id: "SCN-014",
    name: "Placement Eligible Senior",
    category: "Student",
    description: "Final year student with 3.7 GPA and zero backlogs.",
    syntheticPersonaId: "STU-DEMO-00114",
    syntheticPersonaName: "Siddharth Joshi (Synthetic Persona)",
    expectedOutcome: "Shortlisted for Tier-1 Campus Placement Drive.",
    metrics: { gpa: 3.7, backlogs: 0, semester: 7 },
  },
  "SCN-015": {
    id: "SCN-015",
    name: "Research Grant Applicant",
    category: "Research",
    description: "Faculty project proposal for AI in Education research grant.",
    syntheticPersonaId: "RES-DEMO-001",
    syntheticPersonaName: "Dr. Maya Kapoor (Research PI)",
    expectedOutcome: "Institutional ethics & funding approval workflow created.",
    metrics: { grantAmount: 25000 },
  },
  "SCN-FAC-001": {
    id: "SCN-FAC-001",
    name: "Overloaded Faculty",
    category: "Faculty",
    description: "Dr. Rajesh Iyer with workload score 87/100 (18 teaching hrs, 6 invigilation slots).",
    syntheticPersonaId: "FAC-DEMO-001",
    syntheticPersonaName: "Dr. Rajesh Iyer (Synthetic Persona)",
    expectedOutcome: "Identified as OVERLOADED; section redistribution action proposal generated.",
    metrics: { workloadScore: 87, status: "OVERLOADED" },
  },
  "SCN-FAC-002": {
    id: "SCN-FAC-002",
    name: "Faculty Timetable Conflict",
    category: "Faculty",
    description: "Dr. Priya Sharma assigned to 2 rooms simultaneously at 10:00 AM.",
    syntheticPersonaId: "FAC-DEMO-002",
    syntheticPersonaName: "Dr. Priya Sharma (Synthetic Persona)",
    expectedOutcome: "Flagged CRITICAL TIMETABLE_CLASH; 2 resolution options proposed.",
    metrics: { conflictType: "TIMETABLE_CLASH", severity: "CRITICAL" },
  },
  "SCN-FAC-003": {
    id: "SCN-FAC-003",
    name: "Invigilation Overload",
    category: "Faculty",
    description: "Faculty assigned 6 invigilation slots exceeding threshold of 4.",
    syntheticPersonaId: "FAC-DEMO-001",
    syntheticPersonaName: "Dr. Rajesh Iyer (Synthetic Persona)",
    expectedOutcome: "Flagged INVIGILATION_OVERLOAD; slot re-allocation proposal created.",
    metrics: { assignedSlots: 6, maxThreshold: 4 },
  },
  "SCN-FAC-004": {
    id: "SCN-FAC-004",
    name: "Qualified Replacement Available",
    category: "Faculty",
    description: "Dr. Priya Sharma evaluated for CSE204 section assignment.",
    syntheticPersonaId: "FAC-DEMO-002",
    syntheticPersonaName: "Dr. Priya Sharma (Synthetic Persona)",
    expectedOutcome: "Ranked #1 candidate (94% composite fit); proposal created for Admin approval.",
    metrics: { candidateScore: 94, rank: 1 },
  },
  "SCN-FAC-005": {
    id: "SCN-FAC-005",
    name: "No Suitable Replacement",
    category: "Faculty",
    description: "Section allocation request when all department faculty are overloaded/clashed.",
    syntheticPersonaId: "FAC-DEMO-NONE",
    syntheticPersonaName: "No Available Candidate",
    expectedOutcome: "Identified NO_QUALIFIED_CANDIDATES; proposes external adjunct hiring.",
    metrics: { status: "NO_QUALIFIED_CANDIDATES" },
  },
  "SCN-FAC-006": {
    id: "SCN-FAC-006",
    name: "Policy-Limited Redistribution",
    category: "Faculty",
    description: "Redistribution request restricted by Section 4.1 teaching cap policy.",
    syntheticPersonaId: "FAC-DEMO-003",
    syntheticPersonaName: "Policy Boundary Test",
    expectedOutcome: "System enforces policy boundary and flags Human Approval requirement.",
    metrics: { policyGated: true },
  },
};

export class ScenarioRunner {
  public static async runScenario(scenarioId: DemoScenarioId, dataSource: UniversityDataSource): Promise<ScenarioRunResult> {
    const scenario = DEMO_SCENARIOS[scenarioId];
    if (!scenario) {
      throw new Error(`Scenario '${scenarioId}' not found in registry.`);
    }

    const qualityReport = await DataQualityValidator.validateDataset(dataSource);

    let eligibleCount = 0;
    let conditionalCount = 0;
    let blockedCount = 0;

    if (scenarioId === "SCN-001") {
      eligibleCount = 42;
      conditionalCount = 3;
      blockedCount = 2;
    } else if (scenarioId === "SCN-003") {
      eligibleCount = 0;
      conditionalCount = 0;
      blockedCount = 1;
    } else if (scenarioId.startsWith("SCN-FAC-")) {
      eligibleCount = 1;
      conditionalCount = scenarioId === "SCN-FAC-005" ? 0 : 1;
    } else {
      eligibleCount = 1;
    }

    return {
      scenario,
      datasetVersion: "demo-university-v1",
      qualityReport,
      executionPreview: {
        eligibleCount,
        conditionalCount,
        blockedCount,
        requiresHumanAuthorization: true,
      },
      details: {
        timestamp: new Date().toISOString(),
        adapterMode: dataSource.mode,
        decisionSafety: qualityReport.decisionSafety,
      },
    };
  }

  public static listScenarios(): DemoScenarioDefinition[] {
    return Object.values(DEMO_SCENARIOS);
  }
}
