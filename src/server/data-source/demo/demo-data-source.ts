import { UniversityDataSource } from "../university-data-source";
import { UniversityStudent } from "../models/student";
import { UniversityExamination, UniversityEligibilityRecord } from "../models/examination";
import { UniversityAttendance } from "../models/attendance";
import { UniversityFinance } from "../models/finance";
import { UniversityFaculty } from "../models/faculty";
import { UniversityCourse, UniversityCourseSection } from "../models/course";

export class DemoDataSource implements UniversityDataSource {
  public readonly mode = "demo";

  private mockStudents: UniversityStudent[] = [
    {
      id: "stu_001",
      universityStudentId: "STU-DEMO-00101",
      name: "Ananya Sharma (Synthetic Persona)",
      email: "ananya@demo.edu",
      departmentId: "dept_cs",
      departmentCode: "CSE",
      major: "Computer Science",
      gpa: 3.85,
      academicStatus: "GOOD_STANDING",
      organizationId: "org_demo",
    },
    {
      id: "stu_002",
      universityStudentId: "STU-DEMO-00102",
      name: "Vikram Singh (Synthetic Persona)",
      email: "vikram@demo.edu",
      departmentId: "dept_cs",
      departmentCode: "CSE",
      major: "Computer Science",
      gpa: 3.10,
      academicStatus: "GOOD_STANDING",
      organizationId: "org_demo",
    },
    {
      id: "stu_003",
      universityStudentId: "STU-DEMO-00125",
      name: "Rahul Kumar (Synthetic Persona)",
      email: "rahul@demo.edu",
      departmentId: "dept_cs",
      departmentCode: "CSE",
      major: "Computer Science",
      gpa: 2.40,
      academicStatus: "GOOD_STANDING",
      organizationId: "org_demo",
    },
    {
      id: "stu_004",
      universityStudentId: "STU-DEMO-00104",
      name: "Priya Patel (Synthetic Persona)",
      email: "priya@demo.edu",
      departmentId: "dept_ee",
      departmentCode: "ECE",
      major: "Electrical Engineering",
      gpa: 3.50,
      academicStatus: "GOOD_STANDING",
      organizationId: "org_demo",
    },
    {
      id: "stu_005",
      universityStudentId: "STU-DEMO-00105",
      name: "Karan Mehta (Synthetic Persona)",
      email: "karan@demo.edu",
      departmentId: "dept_cs",
      departmentCode: "CSE",
      major: "Computer Science",
      gpa: 1.85,
      academicStatus: "PROBATION",
      organizationId: "org_demo",
    },
    {
      id: "stu_006",
      universityStudentId: "STU-DEMO-00108",
      name: "Sneha Nair (Synthetic Persona)",
      email: "sneha@demo.edu",
      departmentId: "dept_math",
      departmentCode: "MATH",
      major: "Mathematics",
      gpa: 3.95,
      academicStatus: "GOOD_STANDING",
      organizationId: "org_demo",
    },
  ];

  private mockFaculty: UniversityFaculty[] = [
    {
      id: "fac_001",
      name: "Dr. Rajesh Iyer (Synthetic Persona)",
      email: "iyer@demo.edu",
      departmentId: "dept_cs",
      departmentCode: "CSE",
      title: "Professor",
      organizationId: "org_demo",
    },
    {
      id: "fac_002",
      name: "Dr. Priya Sharma (Synthetic Persona)",
      email: "sharma@demo.edu",
      departmentId: "dept_cs",
      departmentCode: "CSE",
      title: "Associate Professor",
      organizationId: "org_demo",
    },
    {
      id: "fac_003",
      name: "Dr. Arun Kumar (Synthetic Persona)",
      email: "kumar@demo.edu",
      departmentId: "dept_ee",
      departmentCode: "ECE",
      title: "Assistant Professor",
      organizationId: "org_demo",
    },
  ];

  public students = {
    findStudentById: async (studentId: string) =>
      this.mockStudents.find((s) => s.id === studentId || s.universityStudentId === studentId) || null,
    findProbationStudents: async () => this.mockStudents.filter((s) => s.academicStatus === "PROBATION" || s.gpa < 2.0),
    listStudents: async (orgId?: string, deptCode?: string) =>
      deptCode ? this.mockStudents.filter((s) => s.departmentCode === deptCode) : this.mockStudents,
  };

  public attendance = {
    getStudentAttendance: async (studentId: string): Promise<UniversityAttendance | null> => {
      const isRahul = studentId === "stu_003" || studentId === "STU-DEMO-00125";
      const isVikram = studentId === "stu_002" || studentId === "STU-DEMO-00102";
      const isKaran = studentId === "stu_005" || studentId === "STU-DEMO-00105";

      const totalClasses = 40;
      const attendedClasses = isRahul ? 23 : isVikram ? 27 : isKaran ? 25 : 36;
      const percentage = isRahul ? 57.5 : isVikram ? 67.5 : isKaran ? 62.5 : 90.0;

      return {
        id: `att_${studentId}`,
        studentId,
        totalClasses,
        attendedClasses,
        percentage,
        lastUpdated: new Date(),
        organizationId: "org_demo",
      };
    },
    getAttendanceShortfallStudents: async (orgId: string, thresholdPercentage: number): Promise<UniversityAttendance[]> => {
      const result: UniversityAttendance[] = [];
      for (const s of this.mockStudents) {
        const att = await this.attendance.getStudentAttendance(s.id);
        if (att && att.percentage < thresholdPercentage) {
          result.push(att);
        }
      }
      return result;
    },
  };

  public examinations = {
    getExaminationById: async (examinationId: string): Promise<UniversityExamination | null> => ({
      id: examinationId,
      name: "Fall 2026 End-Semester Examinations",
      term: "Fall 2026",
      academicYear: "2026-2027",
      startDate: new Date("2026-11-15"),
      endDate: new Date("2026-11-30"),
      status: "SCHEDULED",
      organizationId: "org_demo",
    }),
    listExaminations: async () => [
      {
        id: "exam_fall2026",
        name: "Fall 2026 End-Semester Examinations",
        term: "Fall 2026",
        academicYear: "2026-2027",
        startDate: new Date("2026-11-15"),
        endDate: new Date("2026-11-30"),
        status: "SCHEDULED" as const,
        organizationId: "org_demo",
      },
    ],
    getSchedules: async () => [],
    saveEligibility: async () => {},
    getEligibilityRoster: async (): Promise<UniversityEligibilityRecord[]> => [],
  };

  public finance = {
    getStudentBalance: async (studentId: string): Promise<UniversityFinance | null> => {
      const isRahul = studentId === "stu_003" || studentId === "STU-DEMO-00125";
      const isPriya = studentId === "stu_004" || studentId === "STU-DEMO-00104";

      const balanceOutstanding = isRahul ? 5000 : isPriya ? 1200 : 0;
      const status: "PAID" | "PENDING" | "OVERDUE" = balanceOutstanding > 0 ? "PENDING" : "PAID";

      return {
        id: `fin_${studentId}`,
        studentId,
        totalBilled: 12000,
        totalPaid: 12000 - balanceOutstanding,
        balanceOutstanding,
        status,
        organizationId: "org_demo",
      };
    },
    getOutstandingBalances: async (orgId: string, limit: number): Promise<UniversityFinance[]> => {
      const list: UniversityFinance[] = [];
      for (const s of this.mockStudents) {
        const fin = await this.finance.getStudentBalance(s.id);
        if (fin && fin.balanceOutstanding > 0) {
          list.push(fin);
        }
      }
      return list.slice(0, limit);
    },
  };

  public faculty = {
    listFaculty: async (orgId?: string, deptCode?: string): Promise<UniversityFaculty[]> =>
      deptCode ? this.mockFaculty.filter((f) => f.departmentCode === deptCode) : this.mockFaculty,
  };

  public courses = {
    listCourses: async (): Promise<UniversityCourse[]> => [
      {
        id: "crs_cse101",
        code: "CSE101",
        title: "Introduction to Computer Science",
        departmentId: "dept_cs",
        departmentCode: "CSE",
        credits: 4,
        organizationId: "org_demo",
      },
      {
        id: "crs_cse204",
        code: "CSE204",
        title: "Data Structures & Algorithms",
        departmentId: "dept_cs",
        departmentCode: "CSE",
        credits: 4,
        organizationId: "org_demo",
      },
    ],
    getCourseSections: async (): Promise<UniversityCourseSection[]> => [],
  };

  public results = {
    getStudentResults: async () => [],
  };
}
