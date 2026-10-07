/**
 * Academic Policy Cache (CAG Layer — Context-Augmented Generation)
 * 
 * Pre-loaded, deterministic context cache for institutional academic policies,
 * degree completion criteria, grading scales, credit structures, and rules.
 * 
 * Provides zero-latency static policy injection into the Cognitive Kernel,
 * bypassing heavy vector database/retrieval lookups for frequent regulatory inquiries.
 */

export interface GradingScaleTier {
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  gradePoints: number;
  description: string;
}

export interface DegreeRequirementCriteria {
  totalCreditsRequired: number;
  coreCreditsRequired: number;
  departmentElectiveCredits: number;
  openElectiveCredits: number;
  internshipCredits: number;
  minCgpaForDegree: number;
  minCgpaForHonours: number;
  maxAllowableDurationYears: number;
}

export class AcademicPolicyCache {
  public static readonly VERSION = "2026.1-ACAD";
  public static readonly REGULATION_NAME = "Undergraduate Academic Governance Regulations 2024-2028";

  /**
   * Deterministic Degree Requirements for B.Tech Programs
   */
  public static readonly BTECH_DEGREE_REQUIREMENTS: DegreeRequirementCriteria = {
    totalCreditsRequired: 160,
    coreCreditsRequired: 110,
    departmentElectiveCredits: 30,
    openElectiveCredits: 12,
    internshipCredits: 8,
    minCgpaForDegree: 5.0,
    minCgpaForHonours: 8.0,
    maxAllowableDurationYears: 6,
  };

  /**
   * Institutional 10-Point Grading System
   */
  public static readonly GRADING_TIERS: GradingScaleTier[] = [
    { grade: "O", minPercentage: 90, maxPercentage: 100, gradePoints: 10.0, description: "Outstanding" },
    { grade: "A+", minPercentage: 80, maxPercentage: 89.9, gradePoints: 9.0, description: "Excellent" },
    { grade: "A", minPercentage: 70, maxPercentage: 79.9, gradePoints: 8.0, description: "Very Good" },
    { grade: "B+", minPercentage: 60, maxPercentage: 69.9, gradePoints: 7.0, description: "Good" },
    { grade: "B", minPercentage: 50, maxPercentage: 59.9, gradePoints: 6.0, description: "Above Average" },
    { grade: "C", minPercentage: 40, maxPercentage: 49.9, gradePoints: 5.0, description: "Pass" },
    { grade: "F", minPercentage: 0, maxPercentage: 39.9, gradePoints: 0.0, description: "Fail" },
  ];

  /**
   * Static Academic Policies & Governance Rules
   */
  public static readonly CORE_POLICIES = {
    COURSE_ADD_DROP: "Students may add or drop elective courses within the first 10 instructional days of each semester with faculty advisor sign-off.",
    PREREQUISITE_COMPLIANCE: "A passing grade ('C' or 40% marks) in all prerequisite courses is strictly mandatory prior to course section registration.",
    CREDIT_LOAD_LIMITS: {
      minimumPerSemester: 16,
      maximumPerSemester: 26,
      standardPerSemester: 20,
    },
    HONOURS_REQUIREMENT: "To graduate with B.Tech (Honours), students must maintain CGPA >= 8.0 without any historical backlogs, and earn 20 additional advanced seminar/research credits.",
    ACADEMIC_PROBATION: "Students with CGPA < 5.0 at the conclusion of any academic year are placed on Academic Advisory Probation.",
  };

  /**
   * Pre-tokenized CAG context block for fast injection into LLM prompts
   */
  public static getStaticPolicyPromptBlock(): string {
    return `[STATIC ACADEMIC REGULATIONS CACHE — ${AcademicPolicyCache.REGULATION_NAME}]
1. DEGREE AUDIT REQUIREMENTS (B.Tech):
   - Total Credits: 160 (Core: 110, Department Electives: 30, Open Electives: 12, Internship: 8).
   - Minimum CGPA required for award of degree: 5.0.
   - B.Tech Honours: Requires CGPA >= 8.0, 0 active/historical backlogs, +20 advanced credits.
2. GRADING & PERFORMANCE METRICS (10-Point Scale):
   - O (90-100%): 10.0 | A+ (80-89%): 9.0 | A (70-79%): 8.0 | B+ (60-69%): 7.0 | B (50-59%): 6.0 | C (40-49%): 5.0 (Passing cutoff) | F (<40%): 0.0 (Fail).
3. REGISTRATION & PREREQUISITES:
   - Minimum semester load: 16 credits; Maximum permissible load: 26 credits.
   - Prerequisite compliance is enforced before enrollment. Grade 'C' or higher required.
   - Course add/drop window closes on the 10th instructional calendar day.`;
  }

  /**
   * Instant query resolver for common static policy FAQs
   */
  public static resolveStaticQuery(queryText: string): { matched: boolean; response?: string } {
    const q = queryText.toLowerCase();

    if (/\b(credits? required|total credits|graduation credits|how many credits)\b/i.test(q)) {
      return {
        matched: true,
        response: `Under the ${AcademicPolicyCache.REGULATION_NAME}, a total of ${AcademicPolicyCache.BTECH_DEGREE_REQUIREMENTS.totalCreditsRequired} credits are required to complete the B.Tech degree: ${AcademicPolicyCache.BTECH_DEGREE_REQUIREMENTS.coreCreditsRequired} Core Credits, ${AcademicPolicyCache.BTECH_DEGREE_REQUIREMENTS.departmentElectiveCredits} Department Electives, ${AcademicPolicyCache.BTECH_DEGREE_REQUIREMENTS.openElectiveCredits} Open Electives, and ${AcademicPolicyCache.BTECH_DEGREE_REQUIREMENTS.internshipCredits} Internship Credits with a minimum CGPA of ${AcademicPolicyCache.BTECH_DEGREE_REQUIREMENTS.minCgpaForDegree}.`,
      };
    }

    if (/\b(honou?rs|distinction|b\.?tech honou?rs)\b/i.test(q)) {
      return {
        matched: true,
        response: `For B.Tech with Honours, candidates must maintain a cumulative CGPA of at least ${AcademicPolicyCache.BTECH_DEGREE_REQUIREMENTS.minCgpaForHonours}, have zero backlog history, and complete 20 additional advanced department-approved credits.`,
      };
    }

    if (/\b(grading system|grade scale|passing marks?|passing grade|grade points?)\b/i.test(q)) {
      return {
        matched: true,
        response: `The institutional grading scale operates on a 10-point scale: O (90-100%, 10 pts), A+ (80-89%, 9 pts), A (70-79%, 8 pts), B+ (60-69%, 7 pts), B (50-59%, 6 pts), and C (40-49%, 5 pts). The minimum passing grade is 'C' (40%). Marks below 40% receive an 'F' grade (0 pts).`,
      };
    }

    if (/\b(add drop|drop course|withdraw course|add course deadline)\b/i.test(q)) {
      return {
        matched: true,
        response: AcademicPolicyCache.CORE_POLICIES.COURSE_ADD_DROP,
      };
    }

    return { matched: false };
  }
}
