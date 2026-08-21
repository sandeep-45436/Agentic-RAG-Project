export interface UniversityAttendance {
  id: string;
  studentId: string;
  courseSectionId?: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  lastUpdated: Date;
  organizationId: string;
}
