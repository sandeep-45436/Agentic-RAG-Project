import { UniversityFaculty } from "@/server/data-source/models/faculty";
import { FacultyWorkloadResult } from "./workload-engine";

export interface CandidateAllocationScore {
  facultyId: string;
  facultyName: string;
  departmentCode: string;
  compositeScore: number; // 0 - 100%
  breakdown: {
    expertiseMatch: number; // 35%
    availability: number; // 25%
    capacity: number; // 20%
    scheduleCompatibility: number; // 20%
  };
  isQualified: boolean;
  notes: string;
}

export interface FacultyAllocationProposal {
  proposalId: string;
  targetCourseCode: string;
  targetCourseTitle: string;
  departmentCode: string;
  rankedCandidates: CandidateAllocationScore[];
  recommendedCandidate: CandidateAllocationScore | null;
  requiresHumanApproval: boolean;
  executionPreview: {
    status: "PROPOSAL_GENERATED" | "NO_QUALIFIED_CANDIDATES";
    topCandidateName: string;
    topCandidateScorePct: number;
    recommendedAction: string;
  };
  generatedAt: string;
}

export class AllocationEngine {
  /**
   * Ranks qualified faculty candidates for a course section assignment proposal.
   * Action Proposal Gating: Generates recommendations requiring Human Approval. Never auto-assigns.
   */
  public static evaluateCandidates(
    targetCourseCode: string,
    targetCourseTitle: string,
    departmentCode: string,
    facultyRoster: UniversityFaculty[],
    workloadMap: Map<string, FacultyWorkloadResult>,
    scheduleClashesMap: Map<string, boolean> = new Map()
  ): FacultyAllocationProposal {
    const proposalId = `PROP_ALLOC_${targetCourseCode}_${Date.now()}`;
    const candidateScores: CandidateAllocationScore[] = [];

    for (const fac of facultyRoster) {
      // 1. Expertise Match (35%)
      const isDeptMatch = fac.departmentCode === departmentCode;
      const isDesignationSenior = fac.title.includes("Prof") || fac.title.includes("Dr.");
      const expertiseMatch = isDeptMatch ? (isDesignationSenior ? 98 : 85) : 40;

      // 2. Availability (25%)
      const hasClash = scheduleClashesMap.get(fac.id) || false;
      const availability = hasClash ? 0 : 95;

      // 3. Workload Capacity (20%)
      const workload = workloadMap.get(fac.id);
      let capacity = 90;
      if (workload) {
        if (workload.status === "OVERLOADED") capacity = 40;
        else if (workload.status === "HIGH") capacity = 65;
        else if (workload.status === "MODERATE") capacity = 85;
      }

      // 4. Schedule Compatibility (20%)
      const scheduleCompatibility = hasClash ? 20 : 100;

      // Composite Score Calculation
      const compositeScore = Math.round(
        expertiseMatch * 0.35 + availability * 0.25 + capacity * 0.2 + scheduleCompatibility * 0.2
      );

      const isQualified = isDeptMatch && !hasClash && capacity >= 60;
      let notes = "Qualified candidate with balanced capacity.";
      if (!isDeptMatch) notes = "Department mismatch constraint.";
      else if (hasClash) notes = "Timetable schedule clash constraint.";
      else if (capacity < 60) notes = "Faculty workload capacity constraint (Overloaded).";

      candidateScores.push({
        facultyId: fac.id,
        facultyName: fac.name,
        departmentCode: fac.departmentCode,
        compositeScore,
        breakdown: {
          expertiseMatch,
          availability,
          capacity,
          scheduleCompatibility,
        },
        isQualified,
        notes,
      });
    }

    // Rank candidates descending by compositeScore
    candidateScores.sort((a, b) => b.compositeScore - a.compositeScore);

    const qualifiedCandidates = candidateScores.filter((c) => c.isQualified);
    const recommendedCandidate = qualifiedCandidates[0] || null;

    const status = recommendedCandidate ? "PROPOSAL_GENERATED" : "NO_QUALIFIED_CANDIDATES";
    const recommendedAction = recommendedCandidate
      ? `Propose assigning section of ${targetCourseCode} (${targetCourseTitle}) to ${recommendedCandidate.facultyName} (Score: ${recommendedCandidate.compositeScore}%). Requires Administrator Approval.`
      : `No qualified available faculty candidate found for ${targetCourseCode}. Propose external adjunct recruitment or timetable shift.`;

    return {
      proposalId,
      targetCourseCode,
      targetCourseTitle,
      departmentCode,
      rankedCandidates: candidateScores,
      recommendedCandidate,
      requiresHumanApproval: true,
      executionPreview: {
        status,
        topCandidateName: recommendedCandidate ? recommendedCandidate.facultyName : "None",
        topCandidateScorePct: recommendedCandidate ? recommendedCandidate.compositeScore : 0,
        recommendedAction,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
