import { StudentRiskAssessment } from "./student-risk-predictor";

export interface StudentRecommendations {
  studentActions: string[];
  advisorActions: string[];
  parentNotificationRequired: boolean;
  recommendedWorkflowTrigger?: string;
}

export class StudentRecommender {
  public static recommendActions(assessment: StudentRiskAssessment): StudentRecommendations {
    const studentActions: string[] = [];
    const advisorActions: string[] = [];
    let parentNotificationRequired = false;
    let recommendedWorkflowTrigger: string | undefined;

    if (assessment.academicRisk.isProbation) {
      studentActions.push(
        "Enroll in remedial tutoring sessions and consult academic advisor to improve GPA above 2.0."
      );
      advisorActions.push("Enforce reduced semester credit load limit (max 16 credits during probation)");
      parentNotificationRequired = true;
      recommendedWorkflowTrigger = "TRIGGER_ACADEMIC_PROBATION_ALERT";
    }

    if (assessment.academicRisk.backlogsCount > 0) {
      studentActions.push(
        `Register for supplementary assessments to clear ${assessment.academicRisk.backlogsCount} pending course backlog(s).`
      );
      advisorActions.push("Verify prerequisite dependency chain to prevent subsequent course blocking");
    }

    if (assessment.degreeAudit && assessment.degreeAudit.creditsRemaining > 0) {
      studentActions.push(
        `Plan remaining ${assessment.degreeAudit.creditsRemaining} degree credits across upcoming semesters.`
      );
    }

    if (studentActions.length === 0) {
      studentActions.push("Maintain academic standing; on track for on-time degree completion.");
      advisorActions.push("Regular semester progress review");
    }

    return {
      studentActions,
      advisorActions,
      parentNotificationRequired,
      ...(recommendedWorkflowTrigger ? { recommendedWorkflowTrigger } : {}),
    };
  }
}
