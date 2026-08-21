export interface UniversityCourse {
  id: string;
  code: string;
  title: string;
  credits: number;
  departmentId: string;
  departmentCode: string;
  organizationId: string;
}

export interface UniversityCourseSection {
  id: string;
  courseId: string;
  sectionCode: string;
  term: string;
  facultyId?: string;
  room?: string;
  capacity: number;
  organizationId: string;
}
