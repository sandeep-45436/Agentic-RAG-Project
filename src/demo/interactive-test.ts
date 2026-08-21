import readline from "node:readline";
import { UniversityDataSourceFactory } from "../server/data-source/data-source-factory";
import { DataQualityValidator } from "../server/data-source/validation/quality-reporter";
import { HallTicketEngine } from "../ai/examination/hall-ticket-engine";
import { ExaminationDecisionEngine } from "../ai/decision/examination-decision-engine";
import { AcademicRiskEngine } from "../ai/academic/academic-risk-engine";
import { FacultyOperationsEngine } from "../ai/faculty/faculty-operations-engine";
import { ScenarioRunner } from "../server/data-source/demo/scenario-runner";

async function runInteractiveTest() {
  const dataSource = UniversityDataSourceFactory.getDataSource();

  console.log("\n=========================================================================");
  console.log("    SMART UNIVERSITY OPERATIONS PLATFORM - PRACTICAL DEMO RUNNER        ");
  console.log("=========================================================================");
  console.log(`[Data Source Mode] : DEMO (${dataSource.mode})`);
  console.log(`[Canonical Schema] : Canonical University Model v1`);
  console.log(`[Dataset Version] : demo-university-v1`);
  console.log("=========================================================================\n");

  console.log("Select a practical test scenario to execute:\n");
  console.log("  [1] Demo 1: Policy RAG Check (Attendance & Exam Regulations)");
  console.log("  [2] Demo 2: Student Exam Eligibility & Risk Query (Rahul Kumar Case)");
  console.log("  [3] Demo 3: Combined Cognitive Wow Moment (DB Facts + RAG + Provenance)");
  console.log("  [4] Demo 4: Academic Course Risk Engine (CSE204 High Failure Rate)");
  console.log("  [5] Demo 5: Faculty Workload & Redistribution Proposal (Dr. Rajesh Iyer)");
  console.log("  [6] Demo 6: Data Quality & Safety Gate Audit (Domain Breakdown)");
  console.log("  [7] Run All Scenarios Sequentially (Full Platform Execution)");
  console.log("  [0] Exit\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Enter option number (1-7): ", async (answer) => {
    const choice = answer.trim();

    try {
      if (choice === "1" || choice === "7") {
        console.log("\n-------------------------------------------------------------------------");
        console.log("▶ DEMO 1: KNOWLEDGE INTELLIGENCE (POLICY RAG)");
        console.log("-------------------------------------------------------------------------");
        console.log("Query: 'What is the minimum attendance requirement for exam eligibility?'");
        console.log("\n📖 Retrieved Policy Citation:");
        console.log("  • Document Fact: Section 4.2 - Minimum 75% attendance mandatory for hall ticket issuance.");
        console.log("  • Condonation Policy: Section 4.3 - Attendance between 65%-75% requires Dean medical condonation.");
        console.log("  • Source: University Academic Regulations Handbook (v2026.1)");
      }

      if (choice === "2" || choice === "7") {
        console.log("\n-------------------------------------------------------------------------");
        console.log("▶ DEMO 2: OPERATIONAL INTELLIGENCE (STUDENT EXAM ELIGIBILITY)");
        console.log("-------------------------------------------------------------------------");
        console.log("Evaluating eligibility for Rahul Kumar (STU-DEMO-00125)...");

        const student = await dataSource.students.findStudentById("STU-DEMO-00125", "org_demo");
        const attendance = await dataSource.attendance.getStudentAttendance(student!.id, "org_demo");
        const finance = await dataSource.finance.getStudentBalance(student!.id, "org_demo");

        const decision = HallTicketEngine.evaluateEligibility(
          {
            studentId: student!.id,
            studentNumber: student!.universityStudentId,
            name: student!.name,
            academicStatus: student!.academicStatus,
            attendancePercentage: attendance!.percentage,
            outstandingBalance: finance!.balanceOutstanding,
            internalMarksComplete: true,
          },
          "exam_fall2026"
        );

        console.log(`\n  • Persona Name        : ${student?.name}`);
        console.log(`  • University Student ID: ${student?.universityStudentId}`);
        console.log(`  • Attendance          : ${attendance?.percentage}% (Required: 75%)`);
        console.log(`  • Outstanding Dues    : ₹${finance?.balanceOutstanding}`);
        console.log(`  • Decision Status     : ❌ ${decision.status}`);
        console.log(`  • Blocking Reasons    :`);
        decision.blockingReasons.forEach((r) => console.log(`    - [${r.code}] ${r.description}`));
      }

      if (choice === "3" || choice === "7") {
        console.log("\n-------------------------------------------------------------------------");
        console.log("▶ DEMO 3: COMBINED COGNITIVE WOW MOMENT (PROVENANCE & CITATIONS)");
        console.log("-------------------------------------------------------------------------");
        const student = await dataSource.students.findStudentById("STU-DEMO-00125", "org_demo");
        const attendance = await dataSource.attendance.getStudentAttendance(student!.id, "org_demo");
        const finance = await dataSource.finance.getStudentBalance(student!.id, "org_demo");

        const decision = HallTicketEngine.evaluateEligibility(
          {
            studentId: student!.id,
            studentNumber: student!.universityStudentId,
            name: student!.name,
            academicStatus: student!.academicStatus,
            attendancePercentage: attendance!.percentage,
            outstandingBalance: finance!.balanceOutstanding,
            internalMarksComplete: true,
          },
          "exam_fall2026"
        );

        const report = ExaminationDecisionEngine.synthesizeDecision(decision, student!.name, student!.universityStudentId, [
          {
            citationId: "cit_001",
            documentName: "Academic Handbook 2026",
            documentVersion: 1,
            content: "Section 4.2: Students with attendance below 65% are strictly ineligible for examination registration.",
            pageNumber: 14,
          } as any,
        ]);

        console.log("\n🛡️ Provenance Audit Chain:");
        report.provenance.forEach((p) => {
          console.log(`  [${p.type}] ${p.statement}`);
          if (p.qualityMetadata) {
            console.log(`    └─ Quality Metadata: Adapter=${p.qualityMetadata.source}, Dataset=${p.qualityMetadata.datasetVersion}`);
          }
        });
      }

      if (choice === "4" || choice === "7") {
        console.log("\n-------------------------------------------------------------------------");
        console.log("▶ DEMO 4: ACADEMIC COURSE RISK ENGINE (CSE DEPARTMENT)");
        console.log("-------------------------------------------------------------------------");
        const acadReport = await AcademicRiskEngine.analyzeAcademicRisk(dataSource, "org_demo", "CSE");
        console.log(`\n${acadReport.flagshipAnswer}`);
      }

      if (choice === "5" || choice === "7") {
        console.log("\n-------------------------------------------------------------------------");
        console.log("▶ DEMO 5: FACULTY WORKLOAD & REDISTRIBUTION PROPOSAL");
        console.log("-------------------------------------------------------------------------");
        const facReport = await FacultyOperationsEngine.analyzeFacultyOperations(dataSource, "org_demo", "CSE");
        console.log(`\n${facReport.flagshipAnswer}`);
      }

      if (choice === "6" || choice === "7") {
        console.log("\n-------------------------------------------------------------------------");
        console.log("▶ DEMO 6: DATA QUALITY & SAFETY GATE AUDIT");
        console.log("-------------------------------------------------------------------------");
        const qualityReport = await DataQualityValidator.validateDataset(dataSource);
        console.log(`\n  • Overall Dataset Score : ${qualityReport.overallScore}%`);
        console.log(`  • Overall Status        : ${qualityReport.status}`);
        console.log(`  • Decision Safety Gates :`);
        console.log(`    - Student Risk Analysis  : ${qualityReport.decisionSafety.canRunStudentRisk ? "✅ SAFE" : "❌ BLOCKED"}`);
        console.log(`    - Exam Eligibility Engine: ${qualityReport.decisionSafety.canRunExamEligibility ? "✅ SAFE" : "❌ BLOCKED"}`);
        console.log(`    - Financial Decisions    : ${qualityReport.decisionSafety.canRunFinancialDecision ? "✅ SAFE" : "❌ BLOCKED"}`);
        console.log(`\n  • Domain Quality Breakdown:`);
        Object.entries(qualityReport.domains).forEach(([dom, info]) => {
          console.log(`    - ${dom.padEnd(12)}: Score ${info.score}% | Status ${info.status}`);
        });
      }

      console.log("\n=========================================================================");
      console.log("                     PRACTICAL DEMO EXECUTION COMPLETE                  ");
      console.log("=========================================================================\n");
    } catch (err: any) {
      console.error("Error executing practical test:", err.message);
    } finally {
      rl.close();
    }
  });
}

runInteractiveTest();
