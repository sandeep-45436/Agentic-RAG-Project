import { UniversityStudent } from "./models/student";
import { UniversityFaculty } from "./models/faculty";
import { UniversityCourse, UniversityCourseSection } from "./models/course";
import { UniversityAttendance } from "./models/attendance";
import { UniversityExamination, UniversityExaminationSchedule, UniversityEligibilityRecord } from "./models/examination";
import { UniversityFinance } from "./models/finance";
import { UniversityResult } from "./models/result";

export interface StudentDataRepository {
  findStudentById(studentId: string, organizationId: string): Promise<UniversityStudent | null>;
  findProbationStudents(organizationId: string, gpaThreshold: number): Promise<UniversityStudent[]>;
  listStudents(organizationId: string, departmentCode?: string): Promise<UniversityStudent[]>;
}

export interface AttendanceDataRepository {
  getStudentAttendance(studentId: string, organizationId: string): Promise<UniversityAttendance | null>;
  getAttendanceShortfallStudents(organizationId: string, thresholdPercentage: number): Promise<UniversityAttendance[]>;
}

export interface ExaminationDataRepository {
  getExaminationById(examinationId: string, organizationId: string): Promise<UniversityExamination | null>;
  listExaminations(organizationId: string): Promise<UniversityExamination[]>;
  getSchedules(examinationId: string, organizationId: string): Promise<UniversityExaminationSchedule[]>;
  saveEligibility(data: UniversityEligibilityRecord): Promise<void>;
  getEligibilityRoster(examinationId: string, organizationId: string): Promise<UniversityEligibilityRecord[]>;
}

export interface FinanceDataRepository {
  getStudentBalance(studentId: string, organizationId: string): Promise<UniversityFinance | null>;
  getOutstandingBalances(organizationId: string, limit: number): Promise<UniversityFinance[]>;
}

export interface FacultyDataRepository {
  listFaculty(organizationId: string, departmentCode?: string): Promise<UniversityFaculty[]>;
}

export interface CourseDataRepository {
  listCourses(organizationId: string, departmentCode?: string): Promise<UniversityCourse[]>;
  getCourseSections(organizationId: string): Promise<UniversityCourseSection[]>;
}

export interface ResultsDataRepository {
  getStudentResults(studentId: string, organizationId: string): Promise<UniversityResult[]>;
}

export interface UniversityDataSource {
  readonly mode: "demo" | "postgres" | "api";
  students: StudentDataRepository;
  attendance: AttendanceDataRepository;
  examinations: ExaminationDataRepository;
  finance: FinanceDataRepository;
  faculty: FacultyDataRepository;
  courses: CourseDataRepository;
  results: ResultsDataRepository;
}
