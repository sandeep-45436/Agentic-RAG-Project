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

    if (assessment.attendanceRisk.isAtRisk) {
      studentActions.push(
        `Attend mandatory ${assessment.attendanceRisk.shortfallClasses} make-up lectures before exam hall ticket lockout.`
      );
      advisorActions.push("Issue Attendance Warning & Schedule 1-on-1 Academic Counseling");
      parentNotificationRequired = true;
      recommendedWorkflowTrigger = "TRIGGER_ATTENDANCE_ALERT_WORKFLOW";
    }

    if (assessment.academicRisk.isProbation) {
      studentActions.push(
        `Enroll in CS/Math remedial tutoring classes to improve GPA above 2.0.`
      );
      advisorActions.push("Review semester credit limits (max 14 credits during probation)");
      parentNotificationRequired = true;
    }

    if (assessment.academicRisk.backlogsCount > 0) {
      studentActions.push(`Register for backlog re-examinations in upcoming semester`);
    }

    if (studentActions.length === 0) {
      studentActions.push("Maintain current study regimen and high attendance (>85%)");
      advisorActions.push("Regular semester check-in");
    }

    return {
      studentActions,
      advisorActions,
      parentNotificationRequired,
      ...(recommendedWorkflowTrigger ? { recommendedWorkflowTrigger } : {}),
    };
  }
}
