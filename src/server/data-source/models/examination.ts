import { ExaminationStatus, HallTicketEligibilityStatus } from "@prisma/client";

export interface UniversityExamination {
  id: string;
  name: string;
  term: string;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  status: ExaminationStatus;
  organizationId: string;
}

export interface UniversityExaminationSchedule {
  id: string;
  examinationId: string;
  courseSectionId?: string;
  facilityId?: string;
  examDate: Date;
  startTime: Date;
  endTime: Date;
  capacity: number;
  organizationId: string;
}

export interface UniversityEligibilityRecord {
  id: string;
  examinationId: string;
  studentId: string;
  status: HallTicketEligibilityStatus;
  attendanceEligible: boolean;
  marksEligible: boolean;
  feeEligible: boolean;
  disciplinaryEligible: boolean;
  finalEligible: boolean;
  requiresApproval: boolean;
  blockingReasons: any[];
  recommendations: string[];
  policyReferences: string[];
  organizationId: string;
}
