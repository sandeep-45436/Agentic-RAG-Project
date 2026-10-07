import { AcademicDecisionEngine, DegreeAuditResult } from "./academic-decision-engine";

export interface AcademicRiskResult {
  currentGpa: number;
  isProbation: boolean;
  backlogsCount: number;
  gpaTrend: "UPWARD" | "STABLE" | "DECLINING";
  warningSummary: string;
}

export interface StudentRiskAssessment {
  studentId: string;
  studentName: string;
  studentNumber: string;
  academicRisk: AcademicRiskResult;
  overallRiskScore: number; // 0.0 to 1.0
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  requiresImmediateIntervention: boolean;
  degreeAudit?: DegreeAuditResult;
}

export class StudentRiskPredictor {
  public static predictRisk(studentProfile: any): StudentRiskAssessment {
    if (!studentProfile) {
      return {
        studentId: "unknown",
        studentName: "Unknown Student",
        studentNumber: "N/A",
        academicRisk: {
          currentGpa: 4.0,
          isProbation: false,
          backlogsCount: 0,
          gpaTrend: "STABLE",
          warningSummary: "No profile data available",
        },
        overallRiskScore: 0.0,
        riskLevel: "LOW",
        requiresImmediateIntervention: false,
      };
    }

    const name = studentProfile.user?.name || studentProfile.studentNumber || "Student";
    const gpa = studentProfile.gpa ?? 4.0;
    const isProbation = studentProfile.academicStatus === "Academic Probation" || gpa < 2.0;

    // 1. Evaluate Academic Trend & Backlogs
    const semesterResults = studentProfile.semesterResults || [];
    let backlogsCount = 0;
    let gpaTrend: "UPWARD" | "STABLE" | "DECLINING" = "STABLE";

    if (semesterResults.length > 0) {
      backlogsCount = semesterResults[0].backlogsCount || 0;
      if (semesterResults.length >= 2) {
        const recent = semesterResults[0].sgpa;
        const prev = semesterResults[1].sgpa;
        if (recent < prev - 0.2) gpaTrend = "DECLINING";
        else if (recent > prev + 0.2) gpaTrend = "UPWARD";
      }
    }

    // 2. Compute Overall Academic Risk Score
    let riskScore = 0.0;
    if (isProbation) riskScore += 0.45;
    if (backlogsCount > 0) riskScore += Math.min(0.35, backlogsCount * 0.15);
    if (gpaTrend === "DECLINING") riskScore += 0.20;

    riskScore = Math.min(1.0, parseFloat(riskScore.toFixed(2)));
    const riskLevel = riskScore >= 0.60 ? "HIGH" : riskScore >= 0.30 ? "MEDIUM" : "LOW";

    const warningSummary = isProbation
      ? `Student is currently on Academic Probation with CGPA ${gpa.toFixed(2)}.`
      : backlogsCount > 0
      ? `Active backlog count: ${backlogsCount}. Prerequisite progression may be impacted.`
      : `Academic performance is in Good Standing (CGPA ${gpa.toFixed(2)}).`;

    // 3. Degree Audit Integration
    const enrolments = (studentProfile.enrolments || []).map((e: any) => ({
      courseCode: e.courseSection?.course?.code || "COURSE",
      credits: e.courseSection?.course?.credits || 3,
      grade: e.grade,
      status: e.status,
      isCore: true,
    }));

    const degreeAudit = AcademicDecisionEngine.auditDegreeCredits(
      studentProfile.id || "unknown",
      studentProfile.studentNumber || "N/A",
      enrolments,
      gpa,
      backlogsCount
    );

    return {
      studentId: studentProfile.id,
      studentName: name,
      studentNumber: studentProfile.studentNumber,
      academicRisk: {
        currentGpa: gpa,
        isProbation,
        backlogsCount,
        gpaTrend,
        warningSummary,
      },
      overallRiskScore: riskScore,
      riskLevel,
      requiresImmediateIntervention: riskLevel === "HIGH",
      degreeAudit,
    };
  }
}
