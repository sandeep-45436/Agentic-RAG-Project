import { UniversityDataSource } from "../university-data-source";
import { UniversityStudent } from "../models/student";
import { UniversityAttendance } from "../models/attendance";
import { UniversityFinance } from "../models/finance";
import { UniversityExamination } from "../models/examination";

export class ApiDataSource implements UniversityDataSource {
  public readonly mode = "api";

  public students = {
    findStudentById: async (studentId: string, organizationId: string): Promise<UniversityStudent | null> => {
      // Stub HTTP REST client adapter mapping external SIS/ERP payload to UniversityStudent
      return {
        id: studentId,
        universityStudentId: `SIS_${studentId.substring(0, 6)}`,
        name: "External SIS Student",
        email: "sis.user@university.edu",
        departmentId: "dept_external",
        departmentCode: "SIS",
        major: "Software Engineering",
        gpa: 3.50,
        academicStatus: "GOOD_STANDING",
        organizationId,
      };
    },
    findProbationStudents: async (): Promise<UniversityStudent[]> => [],
    listStudents: async (): Promise<UniversityStudent[]> => [],
  };

  public attendance = {
    getStudentAttendance: async (studentId: string, organizationId: string): Promise<UniversityAttendance | null> => ({
      id: `att_api_${studentId}`,
      studentId,
      totalClasses: 50,
      attendedClasses: 42,
      percentage: 84.0,
      lastUpdated: new Date(),
      organizationId,
    }),
    getAttendanceShortfallStudents: async (): Promise<UniversityAttendance[]> => [],
  };

  public examinations = {
    getExaminationById: async (examinationId: string, organizationId: string): Promise<UniversityExamination | null> => ({
      id: examinationId,
      name: "External SIS Examination 2026",
      term: "Fall 2026",
      academicYear: "2026-2027",
      startDate: new Date(),
      endDate: new Date(),
      status: "SCHEDULED",
      organizationId,
    }),
    listExaminations: async () => [],
    getSchedules: async () => [],
    saveEligibility: async () => {},
    getEligibilityRoster: async () => [],
  };

  public finance = {
    getStudentBalance: async (studentId: string, organizationId: string): Promise<UniversityFinance | null> => ({
      id: `fin_api_${studentId}`,
      studentId,
      totalBilled: 15000,
      totalPaid: 15000,
      balanceOutstanding: 0,
      status: "PAID",
      organizationId,
    }),
    getOutstandingBalances: async () => [],
  };

  public faculty = { listFaculty: async () => [] };
  public courses = { listCourses: async () => [], getCourseSections: async () => [] };
  public results = { getStudentResults: async () => [] };
}
