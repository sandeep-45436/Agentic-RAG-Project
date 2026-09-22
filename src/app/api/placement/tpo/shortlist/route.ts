import { NextRequest, NextResponse } from "next/server";
import { PlacementService } from "@/server/services/placement.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      minCgpa = 7.5,
      maxBacklogs = 0,
      allowedBranches = ["CSE", "AI&DS", "IT"],
      requiredSkills = ["Python", "AWS", "SQL"],
    } = body;

    const rankedCandidates = PlacementService.runTpoCandidateShortlisting({
      minCgpa: Number(minCgpa),
      maxBacklogs: Number(maxBacklogs),
      allowedBranches,
      requiredSkills,
    });

    const eligibleCount = rankedCandidates.filter((c) => c.isEligible).length;

    return NextResponse.json({
      success: true,
      criteria: { minCgpa, maxBacklogs, allowedBranches, requiredSkills },
      totalEvaluated: rankedCandidates.length,
      eligibleCount,
      candidates: rankedCandidates,
      provenance: {
        source: "Demo University Dataset",
        datasetId: "deterministic-demo-v1",
        isDemo: true,
      },
    });
  } catch (error: any) {
    console.error("[API placement TPO shortlist] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to run candidate shortlisting" },
      { status: 500 }
    );
  }
}
