export interface AttendanceRiskResult {
  isAtRisk: boolean;
  lowestPercentage: number;
  examIneligible: boolean;
  shortfallClasses: number;
  warningSummary: string;
}

export interface AcademicRiskResult {
  currentGpa: number;
  isProbation: boolean;
  backlogsCount: number;
  gpaTrend: "UPWARD" | "STABLE" | "DECLINING";
}

export interface StudentRiskAssessment {
  studentId: string;
  studentName: string;
  studentNumber: string;
  attendanceRisk: AttendanceRiskResult;
  academicRisk: AcademicRiskResult;
  overallRiskScore: number; // 0.0 to 1.0
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  requiresImmediateIntervention: boolean;
  examEligibility?: {
    isEligible: boolean;
    blockingReasons: string[];
    recommendations: string[];
  };
}

export class StudentRiskPredictor {
  public static predictRisk(studentProfile: any): StudentRiskAssessment {
    if (!studentProfile) {
      return {
        studentId: "unknown",
        studentName: "Unknown Student",
        studentNumber: "N/A",
        attendanceRisk: {
          isAtRisk: false,
          lowestPercentage: 100,
          examIneligible: false,
          shortfallClasses: 0,
          warningSummary: "No profile data available",
        },
        academicRisk: {
          currentGpa: 4.0,
          isProbation: false,
          backlogsCount: 0,
          gpaTrend: "STABLE",
        },
        overallRiskScore: 0.0,
        riskLevel: "LOW",
        requiresImmediateIntervention: false,
      };
    }

    const name = studentProfile.user?.name || studentProfile.studentNumber || "Student";
    const gpa = studentProfile.gpa ?? 4.0;
    const isProbation = studentProfile.academicStatus === "Academic Probation" || gpa < 2.0;

    // 1. Evaluate Attendance Risk
    const attendanceRecords = studentProfile.attendanceRecords || [];
    let lowestAtt = 100.0;
    let examIneligible = false;
    let shortfallClasses = 0;

    for (const record of attendanceRecords) {
      const pct = record.percentage ?? 100.0;
      if (pct < lowestAtt) lowestAtt = pct;
      if (pct < 75.0) {
        examIneligible = true;
        // Calculate classes needed to reach 75%
        const total = record.totalClasses || 40;
        const attended = record.attendedClasses || Math.round((pct / 100) * total);
        const needed = Math.ceil(0.75 * total) - attended;
        if (needed > shortfallClasses) shortfallClasses = needed;
      }
    }

    const attendanceAtRisk = lowestAtt < 75.0;
    const warningSummary = attendanceAtRisk
      ? `Attendance (${lowestAtt}%) is below 75% threshold. Ineligible for hall ticket.`
      : `Attendance (${lowestAtt}%) satisfies exam requirements.`;

    // 2. Evaluate Academic Risk
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

    // 3. Compute Overall Risk Score
    let riskScore = 0.0;
    if (attendanceAtRisk) riskScore += 0.45;
    if (isProbation) riskScore += 0.35;
    if (backlogsCount > 0) riskScore += 0.15;
    if (gpaTrend === "DECLINING") riskScore += 0.10;

    riskScore = Math.min(1.0, parseFloat(riskScore.toFixed(2)));
    const riskLevel = riskScore >= 0.60 ? "HIGH" : riskScore >= 0.30 ? "MEDIUM" : "LOW";

    // 4. Exam Eligibility Assessment
    const { ExamEligibilityEngine } = require("./exam-eligibility-engine");
    const eligibility = ExamEligibilityEngine.evaluate(studentProfile);

    return {
      studentId: studentProfile.id,
      studentName: name,
      studentNumber: studentProfile.studentNumber,
      attendanceRisk: {
        isAtRisk: attendanceAtRisk,
        lowestPercentage: lowestAtt,
        examIneligible,
        shortfallClasses,
        warningSummary,
      },
      academicRisk: {
        currentGpa: gpa,
        isProbation,
        backlogsCount,
        gpaTrend,
      },
      overallRiskScore: riskScore,
      riskLevel,
      requiresImmediateIntervention: riskLevel === "HIGH",
      examEligibility: {
        isEligible: eligibility.isEligible,
        blockingReasons: eligibility.blockingReasons,
        recommendations: eligibility.recommendations,
      },
    };
  }
}
