export class GoalNormalizer {
  private static readonly RULES: Array<{ pattern: RegExp; canonicalCode: string }> = [
    { pattern: /\b(greeting|hello|hi|hey|good morning|good afternoon)\b/i, canonicalCode: "CONVERSATIONAL_GREETING" },
    { pattern: /\b(attendance|absent|present|roll call)\b/i, canonicalCode: "GET_STUDENT_ATTENDANCE" },
    { pattern: /\b(probation|at-risk|failing|gpa|academic standing)\b/i, canonicalCode: "GET_STUDENT_RISK_PROBATION" },
    { pattern: /\b(policy|handbook|grading|syllabus|credit|deadline)\b/i, canonicalCode: "SEARCH_ACADEMIC_POLICY" },
    { pattern: /\b(email|notify|alert|send message|dispatch)\b/i, canonicalCode: "EXECUTE_COMMUNICATION_WORKFLOW" },
    { pattern: /\b(enrollment|register|course count|total students)\b/i, canonicalCode: "GET_ENROLLMENT_STATISTICS" },
  ];

  public static normalizeGoal(rawQuery: string, intentCategory?: string): string {
    if (intentCategory === "GREETING_CONVERSATIONAL") {
      return "CONVERSATIONAL_GREETING";
    }

    const trimmed = rawQuery.trim();
    for (const rule of GoalNormalizer.RULES) {
      if (rule.pattern.test(trimmed)) {
        return rule.canonicalCode;
      }
    }

    // Default fallback canonical key derived from intent or normalized text
    if (intentCategory) {
      return `CANONICAL_${intentCategory}`;
    }

    const sanitized = trimmed
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 40);

    return `QUERY_${sanitized || "GENERAL"}`;
  }
}
