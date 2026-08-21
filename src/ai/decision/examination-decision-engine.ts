import { HallTicketDecision, BlockingReason } from "@/ai/examination/hall-ticket-engine";
import { Citation } from "@/server/services/citation.service";

export interface ProvenanceQualityMetadata {
  source: string;
  recordValidated: boolean;
  datasetVersion: string;
  freshness: string;
}

export interface ProvenanceItem {
  type: "DATABASE_FACT" | "DOCUMENT_FACT" | "DERIVED_DECISION" | "RECOMMENDATION";
  statement: string;
  source: string;
  citationId?: string;
  qualityMetadata?: ProvenanceQualityMetadata;
}

export interface ExaminationDecisionReport {
  decisionId: string;
  examinationId: string;
  studentId: string;
  decision: "ELIGIBLE" | "INELIGIBLE" | "CONDITIONAL" | "APPROVAL_REQUIRED";
  blockingReasons: BlockingReason[];
  provenance: ProvenanceItem[];
  citations: Citation[];
  requiresHumanApproval: boolean;
  explanation: string;
  generatedAt: string;
}

export class ExaminationDecisionEngine {
  /**
   * Synthesizes database facts, policy handbook citations, and deterministic engine output
   * into a fully auditable ExaminationDecisionReport.
   */
  public static synthesizeDecision(
    eligibilityDecision: HallTicketDecision,
    studentName: string,
    studentNumber: string,
    policyCitations: Citation[] = []
  ): ExaminationDecisionReport {
    const decisionId = `DEC_${eligibilityDecision.examinationId}_${eligibilityDecision.studentId.substring(0, 8)}`;
    const provenance: ProvenanceItem[] = [];

    // 1. Provenance: Database Facts
    provenance.push({
      type: "DATABASE_FACT",
      statement: `Student ${studentName} (${studentNumber}) evaluation metrics compiled.`,
      source: "UniversityDataSource Canonical Interface",
      qualityMetadata: {
        source: "DemoDataSource",
        recordValidated: true,
        datasetVersion: "demo-university-v1",
        freshness: "Dataset Snapshot",
      },
    });

    // 2. Provenance: Document Facts from Policy RAG
    if (policyCitations.length > 0) {
      policyCitations.forEach((cit) => {
        provenance.push({
          type: "DOCUMENT_FACT",
          statement: cit.content.substring(0, 150) + "...",
          source: `${cit.documentName} (v${cit.documentVersion}, Page ${cit.pageNumber || 'N/A'})`,
          citationId: cit.citationId,
        });
      });
    }

    // 3. Provenance: Derived Decision
    const isGroundedEligible = eligibilityDecision.status === "ELIGIBLE";
    let decisionState: "ELIGIBLE" | "INELIGIBLE" | "CONDITIONAL" | "APPROVAL_REQUIRED" = "INELIGIBLE";
    if (eligibilityDecision.status === "ELIGIBLE") decisionState = "ELIGIBLE";
    else if (eligibilityDecision.status === "CONDITIONAL") decisionState = "CONDITIONAL";
    else if (eligibilityDecision.status === "REQUIRES_APPROVAL") decisionState = "APPROVAL_REQUIRED";

    provenance.push({
      type: "DERIVED_DECISION",
      statement: `Deterministic evaluation status: ${eligibilityDecision.status}. Blocking reasons count: ${eligibilityDecision.blockingReasons.length}.`,
      source: "HallTicketEngine Rules Evaluator",
    });

    // 4. Provenance: Recommendations
    eligibilityDecision.recommendations.forEach((rec) => {
      provenance.push({
        type: "RECOMMENDATION",
        statement: rec,
        source: "Examination Operational Intelligence Policy Engine",
      });
    });

    // Generate Natural Language Explanation
    let explanation = "";
    if (decisionState === "ELIGIBLE") {
      explanation = `Student ${studentName} (${studentNumber}) has satisfied all institutional requirements (attendance, financial clearance, internal assessments, and academic standing) and is fully ELIGIBLE for examination registration.`;
    } else {
      const reasonSummary = eligibilityDecision.blockingReasons
        .map((r) => `• [${r.code}] ${r.description}`)
        .join("\n");
      explanation = `Student ${studentName} (${studentNumber}) is currently classified as ${decisionState}.\n\nBlocking Reasons:\n${reasonSummary}\n\nRecommended Action: ${eligibilityDecision.recommendations.join("; ")}`;
    }

    return {
      decisionId,
      examinationId: eligibilityDecision.examinationId,
      studentId: eligibilityDecision.studentId,
      decision: decisionState,
      blockingReasons: eligibilityDecision.blockingReasons,
      provenance,
      citations: policyCitations,
      requiresHumanApproval: eligibilityDecision.requiresApproval,
      explanation,
      generatedAt: new Date().toISOString(),
    };
  }
}
