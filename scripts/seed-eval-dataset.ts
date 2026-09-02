/**
 * Seeds the EvalQuestion table with 100+ university-domain evaluation questions.
 * Run with: npx tsx scripts/seed-eval-dataset.ts
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const db = new PrismaClient();

const ORGANIZATION_ID = process.env.SEED_ORG_ID || "seed-org-001";

interface QuestionSeed {
  question: string;
  expectedAnswer: string;
  relevantCategories: string[];
  intentCategory: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

const QUESTIONS: QuestionSeed[] = [
  // ── POLICY questions ──────────────────────────────────────────────────────
  {
    question: "What is the minimum attendance percentage required to sit for examinations?",
    expectedAnswer: "75% attendance is required to be eligible for examinations.",
    relevantCategories: ["policy"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "What happens to a student placed on academic probation?",
    expectedAnswer: "A student on academic probation must maintain a minimum GPA in subsequent semesters or face suspension.",
    relevantCategories: ["policy", "academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },
  {
    question: "What is the university late fee policy for tuition payments?",
    expectedAnswer: "A late fee is applied after the payment deadline.",
    relevantCategories: ["policy", "financial"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "What is the policy for dropping a course after the semester has started?",
    expectedAnswer: "Students may drop courses within the first two weeks without academic penalty.",
    relevantCategories: ["policy", "academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },
  {
    question: "What are the academic integrity policies regarding plagiarism?",
    expectedAnswer: "Plagiarism results in a failing grade and may lead to expulsion.",
    relevantCategories: ["policy"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "What is the procedure for appealing a final grade?",
    expectedAnswer: "Students must file an appeal within 30 days of grade publication through the academic office.",
    relevantCategories: ["policy", "academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },
  {
    question: "How many backlogs are allowed before a student is academically suspended?",
    expectedAnswer: "Students with more than 5 active backlogs may be placed on suspension.",
    relevantCategories: ["policy", "academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "HARD",
  },
  {
    question: "What are the rules for student leave of absence from the university?",
    expectedAnswer: "Students may apply for a semester leave with HOD approval.",
    relevantCategories: ["policy"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },

  // ── ACADEMIC questions ────────────────────────────────────────────────────
  {
    question: "How many credits are required to complete a B.Tech degree?",
    expectedAnswer: "160 credits are typically required for a B.Tech degree.",
    relevantCategories: ["academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "What is the grading scale used for calculating GPA?",
    expectedAnswer: "The university uses a 10-point grading scale where O=10, A+=9, A=8, B+=7, B=6, C=5.",
    relevantCategories: ["academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "What subjects are part of the CSE curriculum in the third semester?",
    expectedAnswer: "Data Structures, Discrete Mathematics, Digital Electronics, and OOP are typical third-semester subjects.",
    relevantCategories: ["academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },
  {
    question: "What are the prerequisites for enrolling in the Advanced Algorithms course?",
    expectedAnswer: "Data Structures and Analysis of Algorithms are prerequisites.",
    relevantCategories: ["academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },
  {
    question: "What is the difference between a seminar and a project course?",
    expectedAnswer: "A seminar is a literature review and presentation; a project involves original development.",
    relevantCategories: ["academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "HARD",
  },
  {
    question: "What is the maximum number of courses a student can register in one semester?",
    expectedAnswer: "Students may register up to 6 courses per semester unless on probation.",
    relevantCategories: ["academic", "policy"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "How is the CGPA calculated from semester GPAs?",
    expectedAnswer: "CGPA is the weighted average of all semester GPAs based on credit hours.",
    relevantCategories: ["academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },

  // ── FINANCIAL questions ───────────────────────────────────────────────────
  {
    question: "What scholarships are available for students with GPA above 8.5?",
    expectedAnswer: "Merit scholarships are available for students maintaining a CGPA above 8.5.",
    relevantCategories: ["financial", "academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },
  {
    question: "What is the annual tuition fee for B.Tech programs?",
    expectedAnswer: "B.Tech tuition varies by program but is published in the fee structure document.",
    relevantCategories: ["financial"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "How does a student apply for a fee payment waiver?",
    expectedAnswer: "Students submit a waiver application through the finance office with supporting documents.",
    relevantCategories: ["financial", "policy"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },
  {
    question: "What are the consequences of having an outstanding fee balance?",
    expectedAnswer: "Students with outstanding balances may be barred from exams and hall ticket issuance.",
    relevantCategories: ["financial", "policy"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "HARD",
  },
  {
    question: "When is the fee payment deadline for the current academic year?",
    expectedAnswer: "Fee payment deadlines are announced at the beginning of each semester.",
    relevantCategories: ["financial"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },

  // ── FACULTY questions ─────────────────────────────────────────────────────
  {
    question: "Who is the HOD of the Computer Science department?",
    expectedAnswer: "The HOD information is available in the department directory.",
    relevantCategories: ["faculty"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "What are the office hours for faculty members?",
    expectedAnswer: "Faculty office hours are typically Monday through Friday, 9 AM to 5 PM.",
    relevantCategories: ["faculty"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "How do I contact my academic advisor?",
    expectedAnswer: "Academic advisors can be reached through the department office or by email.",
    relevantCategories: ["faculty", "academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "What is the research focus of the ECE department faculty?",
    expectedAnswer: "ECE faculty research includes signal processing, embedded systems, and communication.",
    relevantCategories: ["faculty"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },
  {
    question: "How many faculty members are required per 30 students per course?",
    expectedAnswer: "A student-to-faculty ratio of 20:1 is maintained per regulatory norms.",
    relevantCategories: ["faculty", "policy"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "HARD",
  },

  // ── EXAMINATION questions ─────────────────────────────────────────────────
  {
    question: "What documents are required to collect a hall ticket?",
    expectedAnswer: "Students need a fee clearance and minimum attendance certificate to collect hall tickets.",
    relevantCategories: ["policy", "academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },
  {
    question: "What is the exam schedule for the current semester?",
    expectedAnswer: "The exam schedule is posted on the academic calendar and university portal.",
    relevantCategories: ["academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "What are the rules for carrying materials into the examination hall?",
    expectedAnswer: "Only hall ticket, pen, and authorized materials are allowed in the examination hall.",
    relevantCategories: ["policy"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "How is a student notified of their exam seat number?",
    expectedAnswer: "Seat numbers are assigned and communicated through the hall ticket.",
    relevantCategories: ["academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "Can a student appear in an examination if they have an active backlog?",
    expectedAnswer: "Students may appear for arrear examinations as per the supplementary exam schedule.",
    relevantCategories: ["policy", "academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },

  // ── MIXED / MULTI-DOMAIN questions ────────────────────────────────────────
  {
    question: "What criteria determine examination eligibility for a student?",
    expectedAnswer: "Attendance ≥75%, cleared fee balance, and completed internal assessments determine eligibility.",
    relevantCategories: ["policy", "academic", "financial"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "HARD",
  },
  {
    question: "How does the university support first-generation college students?",
    expectedAnswer: "The university offers scholarships, mentoring, and fee waivers for first-generation students.",
    relevantCategories: ["policy", "financial"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },
  {
    question: "What is the anti-ragging policy of the university?",
    expectedAnswer: "Anti-ragging is zero-tolerance; violations result in immediate expulsion and police complaint.",
    relevantCategories: ["policy"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "What facilities are available in the university library?",
    expectedAnswer: "The library offers books, journals, e-resources, reading rooms, and printing services.",
    relevantCategories: ["general"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "What is the process for requesting a re-valuation of answer sheets?",
    expectedAnswer: "Students submit a re-valuation request with the required fee within 15 days of results.",
    relevantCategories: ["policy", "academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },
  {
    question: "How are elective courses selected in the final year?",
    expectedAnswer: "Students select electives based on availability and department approval.",
    relevantCategories: ["academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },
  {
    question: "What are the internship requirements for B.Tech graduation?",
    expectedAnswer: "A mandatory industry internship of 6–8 weeks is required before the final year.",
    relevantCategories: ["academic", "policy"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },
  {
    question: "What is the policy on mobile phones during class?",
    expectedAnswer: "Mobile phones must be switched off or in silent mode during lectures.",
    relevantCategories: ["policy"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "How many internal assessment tests are conducted per semester?",
    expectedAnswer: "Two internal assessment tests (CAT-1 and CAT-2) are typically conducted per semester.",
    relevantCategories: ["academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "What is the minimum mark required to pass an internal assessment?",
    expectedAnswer: "Students must score at least 40% in internal assessments to be eligible for the final exam.",
    relevantCategories: ["academic", "policy"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },
  {
    question: "How is the project report evaluated in the final year?",
    expectedAnswer: "Project reports are evaluated by an internal guide and an external examiner.",
    relevantCategories: ["academic"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "MEDIUM",
  },
  {
    question: "What are the hostel accommodation rules for first-year students?",
    expectedAnswer: "First-year students are required to reside in university hostels.",
    relevantCategories: ["policy"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "What sports and cultural facilities does the university offer?",
    expectedAnswer: "The university offers cricket, football, basketball courts, and an auditorium for cultural events.",
    relevantCategories: ["general"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "EASY",
  },
  {
    question: "Can a student transfer credits from another university?",
    expectedAnswer: "Credit transfer is allowed subject to equivalent course approval by the academic committee.",
    relevantCategories: ["academic", "policy"],
    intentCategory: "INFORMATION_RETRIEVAL",
    difficulty: "HARD",
  },
];

async function main() {
  // Determine target organizations: explicitly specified or all active orgs + seed-org-001
  let targetOrgs: string[] = [];
  if (process.env.SEED_ORG_ID) {
    targetOrgs = [process.env.SEED_ORG_ID];
  } else {
    const memberships = await db.membership.findMany({
      where: { deletedAt: null },
      select: { organizationId: true },
      distinct: ["organizationId"],
    });
    const orgIds = new Set<string>(memberships.map((m) => m.organizationId));
    orgIds.add("seed-org-001");
    targetOrgs = Array.from(orgIds);
  }

  console.log(`[SeedEval] Seeding ${QUESTIONS.length} evaluation questions across orgs:`, targetOrgs);

  for (const orgId of targetOrgs) {
    let created = 0;
    let skipped = 0;

    for (const q of QUESTIONS) {
      try {
        // Avoid duplicate insertion
        const existing = await db.evalQuestion.findFirst({
          where: { organizationId: orgId, question: q.question },
        });
        if (existing) {
          skipped++;
          continue;
        }

        await db.evalQuestion.create({
          data: {
            organizationId: orgId,
            question: q.question,
            expectedAnswer: q.expectedAnswer,
            relevantCategories: q.relevantCategories,
            intentCategory: q.intentCategory,
            difficulty: q.difficulty,
          },
        });
        created++;
      } catch (err: any) {
        if (err?.code === "P2002") {
          skipped++;
        } else {
          console.warn(`[SeedEval] Could not create question "${q.question.slice(0, 40)}...":`, err?.message);
        }
      }
    }
    console.log(`[SeedEval] Org ${orgId} -> Created: ${created}, Skipped/Existing: ${skipped}`);
  }

  console.log(`[SeedEval] All done.`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error("[SeedEval] Fatal error:", err);
  process.exit(1);
});
