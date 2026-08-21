export type StudentAcademicStatus = "GOOD_STANDING" | "PROBATION" | "SUSPENDED" | "GRADUATED";

export interface UniversityStudent {
  id: string;
  universityStudentId: string; // Roll number / Registration number e.g., STU2026001
  name: string;
  email: string;
  departmentId: string;
  departmentCode: string;
  major: string;
  gpa: number;
  academicStatus: StudentAcademicStatus;
  advisorId?: string;
  organizationId: string;
}
