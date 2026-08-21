import { db } from "@/server/db/prisma";

export interface StudentRiskAssessment {
  studentId: string;
  studentNumber: string;
  major: string;
  gpa: number;
  academicStatus: string;
  riskLevel: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  riskScore: number;
  factors: string[];
  suggestedIntervention: string;
  recommendedAction: string;
}

export interface DepartmentHealthReport {
  departmentId: string;
  departmentCode: string;
  name: string;
  totalStudents: number;
  atRiskStudentsCount: number;
  totalFaculty: number;
  totalCourses: number;
  annualBudget: number;
  healthIndexScore: number;
  healthStatus: "EXCELLENT" | "STABLE" | "ATTENTION_REQUIRED" | "CRITICAL";
}

export class DecisionIntelligenceService {
  /**
   * Evaluates academic risk for students in an organization.
   * Derives insights rather than returning static raw data.
   */
  static async assessStudentRisk(organizationId: string, limit = 20): Promise<StudentRiskAssessment[]> {
    console.log(`[DecisionIntelligence] Computing student risk assessments for org: ${organizationId}`);

    const students = await db.student.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        financialAccounts: true,
        enrolments: true,
      },
      take: limit,
      orderBy: { gpa: "asc" },
    });

    return students.map((s) => {
      const factors: string[] = [];
      let riskScore = 0;

      // GPA Factor
      if (s.gpa < 2.0) {
        riskScore += 50;
        factors.push(`GPA (${s.gpa.toFixed(2)}) below probation threshold (2.0)`);
      } else if (s.gpa < 2.5) {
        riskScore += 25;
        factors.push(`GPA (${s.gpa.toFixed(2)}) approaching warning threshold`);
      }

      // Financial Overdue Factor
      const overdueAccount = s.financialAccounts.find((fa) => fa.status === "Overdue" || fa.balanceOutstanding > 1000);
      if (overdueAccount) {
        riskScore += 30;
        factors.push(`Unpaid financial balance of $${overdueAccount.balanceOutstanding.toFixed(2)}`);
      }

      // Academic Status Factor
      if (s.academicStatus === "Academic Probation") {
        riskScore += 20;
        factors.push("Currently on Academic Probation");
      }

      let riskLevel: "CRITICAL" | "HIGH" | "MODERATE" | "LOW" = "LOW";
      let suggestedIntervention = "Standard academic monitoring.";
      let recommendedAction = "Maintain regular advisor check-ins.";

      if (riskScore >= 70) {
        riskLevel = "CRITICAL";
        suggestedIntervention = "Immediate mandatory academic advisor intervention and financial aid counselling.";
        recommendedAction = "Issue Academic Support Notice and assign dedicated peer tutor.";
      } else if (riskScore >= 40) {
        riskLevel = "HIGH";
        suggestedIntervention = "Bi-weekly progress check-ins with faculty advisor.";
        recommendedAction = "Recommend study skill workshops and course load adjustment.";
      } else if (riskScore >= 20) {
        riskLevel = "MODERATE";
        suggestedIntervention = "End-of-term academic review.";
        recommendedAction = "Encourage office hour participation.";
      }

      return {
        studentId: s.id,
        studentNumber: s.studentNumber,
        major: s.major,
        gpa: s.gpa,
        academicStatus: s.academicStatus,
        riskLevel,
        riskScore: Math.min(riskScore, 100),
        factors: factors.length > 0 ? factors : ["No major risk factors detected"],
        suggestedIntervention,
        recommendedAction,
      };
    });
  }

  /**
   * Generates Departmental Health Index reports based on faculty ratio, GPA averages, and budget utilization.
   */
  static async evaluateDepartmentHealth(organizationId: string): Promise<DepartmentHealthReport[]> {
    console.log(`[DecisionIntelligence] Computing departmental health reports for org: ${organizationId}`);

    const departments = await db.department.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        students: true,
        faculty: true,
        courses: true,
      },
    });

    return departments.map((d) => {
      const totalStudents = d.students.length;
      const atRiskStudentsCount = d.students.filter((s) => s.gpa < 2.5).length;
      const totalFaculty = d.faculty.length;
      const totalCourses = d.courses.length;

      const studentFacultyRatio = totalFaculty > 0 ? totalStudents / totalFaculty : totalStudents;
      
      let healthScore = 100;

      // Penalize high student-to-faculty ratio (> 25)
      if (studentFacultyRatio > 25) healthScore -= 20;

      // Penalize high percentage of at-risk students (> 15%)
      const atRiskPercentage = totalStudents > 0 ? (atRiskStudentsCount / totalStudents) * 100 : 0;
      if (atRiskPercentage > 20) healthScore -= 30;
      else if (atRiskPercentage > 10) healthScore -= 15;

      let healthStatus: "EXCELLENT" | "STABLE" | "ATTENTION_REQUIRED" | "CRITICAL" = "EXCELLENT";
      if (healthScore < 50) healthStatus = "CRITICAL";
      else if (healthScore < 70) healthStatus = "ATTENTION_REQUIRED";
      else if (healthScore < 85) healthStatus = "STABLE";

      return {
        departmentId: d.id,
        departmentCode: d.code,
        name: d.name,
        totalStudents,
        atRiskStudentsCount,
        totalFaculty,
        totalCourses,
        annualBudget: d.annualBudget,
        healthIndexScore: healthScore,
        healthStatus,
      };
    });
  }
}
