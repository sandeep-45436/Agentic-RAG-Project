import { VectorPayload } from "@/server/services/vector.service";
import { normalizeChunkText } from "@/server/utils/chunk-hasher";

export type ClaimType = "DATABASE_FACT" | "DOCUMENT_FACT" | "DERIVED_DECISION" | "RECOMMENDATION";

export interface ClaimValidation {
  claimText: string;
  claimType: ClaimType;
  citedId: number | null;
  grounded: boolean;
  overlapScore: number;
  semanticScore: number;
  reason?: string;
}

export interface CitationGroundingReport {
  isGrounded: boolean;
  groundingScore: number;
  totalClaims: number;
  groundedClaimsCount: number;
  claims: ClaimValidation[];
  unsupportedClaims: string[];
  misattributedCitations: string[];
  recommendedAction: "PASS" | "REGENERATE" | "PARTIAL_RESPONSE" | "REJECT";
}

export class CitationGroundingValidator {
  /**
   * Evaluates claim-level citation grounding across response text and retrieved evidence chunks.
   */
  public static validateCitationGrounding(
    responseText: string,
    chunks: VectorPayload[],
    databaseRecordsCount: number = 0,
    minGroundingThreshold: number = 0.65
  ): CitationGroundingReport {
    if (!responseText || responseText.trim().length === 0) {
      return {
        isGrounded: false,
        groundingScore: 0,
        totalClaims: 0,
        groundedClaimsCount: 0,
        claims: [],
        unsupportedClaims: ["Empty response"],
        misattributedCitations: [],
        recommendedAction: "REJECT",
      };
    }

    // Move trailing citation markers (e.g., ". [Citation 1]") before sentence-ending punctuation so citations stay attached to their claim
    const normalizedResponse = responseText.replace(/\.\s*(\[(?:Citation\s*(?:ID:\s*)?)?\d+\])/gi, " $1.");

    // Split response into sentences/claims
    const sentences = normalizedResponse
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3);

    const chunkMap = new Map<number, VectorPayload>();
    chunks.forEach((chunk, index) => {
      chunkMap.set(index + 1, chunk);
    });

    const claims: ClaimValidation[] = [];
    const unsupportedClaims: string[] = [];
    const misattributedCitations: string[] = [];

    for (const sentence of sentences) {
      // Extract citation ID markers e.g., [Citation ID: 1], [Citation 1], or [1]
      const citationMatch = sentence.match(/\[(?:Citation\s*(?:ID:\s*)?)?(\d+)\]/i);
      const citedId = citationMatch ? parseInt(citationMatch[1], 10) : null;
      
      const cleanSentence = sentence.replace(/\[.*?\]/g, "").trim();
      const claimType = this.classifyClaimType(cleanSentence, citedId, databaseRecordsCount);

      if (citedId !== null) {
        const citedChunk = chunkMap.get(citedId);
        if (!citedChunk) {
          misattributedCitations.push(`Citation [${citedId}] referenced in claim "${cleanSentence}" does not exist in context.`);
          claims.push({
            claimText: cleanSentence,
            claimType,
            citedId,
            grounded: false,
            overlapScore: 0,
            semanticScore: 0,
            reason: `Missing citation reference [${citedId}]`,
          });
          unsupportedClaims.push(cleanSentence);
          continue;
        }

        // Calculate lexical overlap and token coverage
        const overlapScore = this.calculateLexicalOverlap(cleanSentence, citedChunk.chunkText);
        const semanticScore = this.calculateKeywordCoverage(cleanSentence, citedChunk.chunkText);
        
        // Enforce strict numerical consistency when numbers/percentages are mentioned
        const numbersInClaim = cleanSentence.match(/\b\d+(?:\.\d+)?%?/g) || [];
        const hasNumberMismatch = numbersInClaim.some(
          (num) => !citedChunk.chunkText.toLowerCase().includes(num.toLowerCase())
        );

        const isClaimGrounded = !hasNumberMismatch && (overlapScore >= 0.30 || semanticScore >= 0.50);

        if (!isClaimGrounded) {
          misattributedCitations.push(`Claim "${cleanSentence}" cites [Citation ${citedId}], but source chunk content does not support it.`);
          unsupportedClaims.push(cleanSentence);
        }

        claims.push({
          claimText: cleanSentence,
          claimType,
          citedId,
          grounded: isClaimGrounded,
          overlapScore,
          semanticScore,
          reason: isClaimGrounded
            ? "Grounded by source text"
            : hasNumberMismatch
            ? "Numerical mismatch with cited chunk"
            : "Cited chunk lacks semantic support",
        });
      } else {
        // Uncited claim: verify if supported by any retrieved chunk or DB record
        if (claimType === "DATABASE_FACT" && databaseRecordsCount > 0) {
          claims.push({
            claimText: cleanSentence,
            claimType,
            citedId: null,
            grounded: true,
            overlapScore: 1.0,
            semanticScore: 1.0,
            reason: "Supported by structured database record",
          });
        } else if (claimType === "RECOMMENDATION" || claimType === "DERIVED_DECISION") {
          claims.push({
            claimText: cleanSentence,
            claimType,
            citedId: null,
            grounded: true,
            overlapScore: 0.8,
            semanticScore: 0.8,
            reason: "Derived synthesis from validated evidence",
          });
        } else {
          // Document claim without explicit citation tag - check across chunks
          let bestOverlap = 0;
          let bestChunkId: number | null = null;
          for (const [id, chunk] of chunkMap.entries()) {
            const overlap = this.calculateLexicalOverlap(cleanSentence, chunk.chunkText);
            if (overlap > bestOverlap) {
              bestOverlap = overlap;
              bestChunkId = id;
            }
          }

          const isImplicitGrounded = bestOverlap >= 0.35;
          if (!isImplicitGrounded && chunks.length > 0) {
            unsupportedClaims.push(cleanSentence);
          }

          claims.push({
            claimText: cleanSentence,
            claimType,
            citedId: bestChunkId,
            grounded: isImplicitGrounded || chunks.length === 0,
            overlapScore: bestOverlap,
            semanticScore: bestOverlap,
            reason: isImplicitGrounded ? `Implicitly grounded by Citation ${bestChunkId}` : "Uncited claim without evidence support",
          });
        }
      }
    }

    const totalClaims = claims.length;
    const groundedClaimsCount = claims.filter((c) => c.grounded).length;
    const groundingScore = totalClaims > 0 ? Number((groundedClaimsCount / totalClaims).toFixed(2)) : 1.0;
    const isGrounded = groundingScore >= minGroundingThreshold && misattributedCitations.length === 0;

    let recommendedAction: "PASS" | "REGENERATE" | "PARTIAL_RESPONSE" | "REJECT" = "PASS";
    if (!isGrounded) {
      if (groundingScore < 0.30) {
        recommendedAction = "REJECT";
      } else if (misattributedCitations.length > 0) {
        recommendedAction = "REGENERATE";
      } else {
        recommendedAction = "PARTIAL_RESPONSE";
      }
    }

    return {
      isGrounded,
      groundingScore,
      totalClaims,
      groundedClaimsCount,
      claims,
      unsupportedClaims,
      misattributedCitations,
      recommendedAction,
    };
  }

  /**
   * Classifies a claim into DATABASE_FACT, DOCUMENT_FACT, DERIVED_DECISION, or RECOMMENDATION.
   */
  private static classifyClaimType(sentence: string, citedId: number | null, dbRecordsCount: number): ClaimType {
    const lower = sentence.toLowerCase();
    if (lower.includes("should") || lower.includes("recommend") || lower.includes("advised")) {
      return "RECOMMENDATION";
    }
    if (lower.includes("therefore") || lower.includes("consequently") || lower.includes("status is") || lower.includes("eligible")) {
      return "DERIVED_DECISION";
    }
    if ((dbRecordsCount > 0 && /\b(id|score|gpa|attendance|count|total|record|student|grade)\b/i.test(sentence)) || citedId === null) {
      return "DATABASE_FACT";
    }
    return "DOCUMENT_FACT";
  }

  /**
   * Calculates Jaccard lexical word overlap between claim and source text.
   */
  private static calculateLexicalOverlap(claimText: string, chunkText: string): number {
    const tokenize = (text: string) =>
      new Set(
        normalizeChunkText(text)
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .split(/\s+/)
          .filter((w) => w.length > 3)
      );

    const claimTokens = tokenize(claimText);
    const chunkTokens = tokenize(chunkText);

    if (claimTokens.size === 0) return 1.0;

    let matchCount = 0;
    for (const token of claimTokens) {
      if (chunkTokens.has(token)) {
        matchCount++;
      }
    }

    return matchCount / claimTokens.size;
  }

  /**
   * Calculates key number / term coverage.
   */
  private static calculateKeywordCoverage(claimText: string, chunkText: string): number {
    const numbersInClaim = claimText.match(/\b\d+(?:\.\d+)?%?/g) || [];
    if (numbersInClaim.length === 0) {
      return this.calculateLexicalOverlap(claimText, chunkText);
    }

    const chunkNormalized = chunkText.toLowerCase();
    let matches = 0;
    for (const num of numbersInClaim) {
      if (chunkNormalized.includes(num.toLowerCase())) {
        matches++;
      }
    }

    return matches / numbersInClaim.length;
  }
}
