export interface DecisionMemoryEntry {
  id: string;
  normalizedGoal: string;
  queryText: string;
  decisionMade: string;
  outcomeStatus: "SUCCESS" | "POLICY_VIOLATION" | "RECOVERY_NEEDED" | "FAILED";
  lessonLearned: string;
  timestamp: string;
}

export class DecisionMemory {
  private static memoryStore: DecisionMemoryEntry[] = [
    {
      id: "mem-001",
      normalizedGoal: "VALIDATE_COURSE_PREREQUISITES",
      queryText: "Can student STU-102 enroll in CS402 Distributed Systems without CS301?",
      decisionMade: "Block registration via AcademicDecisionEngine; invoke Neo4j graph lookup for prerequisite tree",
      outcomeStatus: "POLICY_VIOLATION",
      lessonLearned: "Traverse graph dependencies before checking student transcript to avoid unnecessary student DB full-scans",
      timestamp: new Date().toISOString(),
    },
    {
      id: "mem-002",
      normalizedGoal: "AUDIT_DEGREE_CREDITS",
      queryText: "Degree audit for final year student with 156 credits",
      decisionMade: "Execute deterministic credit calculator and return exact deficit of 4 credits",
      outcomeStatus: "SUCCESS",
      lessonLearned: "Use deterministic arithmetic instead of LLM token generation for credit totals",
      timestamp: new Date().toISOString(),
    },
  ];

  public static queryMemory(normalizedGoal: string): DecisionMemoryEntry[] {
    return DecisionMemory.memoryStore.filter((m) => m.normalizedGoal === normalizedGoal);
  }

  public static recordDecision(entry: Omit<DecisionMemoryEntry, "id" | "timestamp">): DecisionMemoryEntry {
    const record: DecisionMemoryEntry = {
      ...entry,
      id: `mem-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    DecisionMemory.memoryStore.push(record);
    return record;
  }
}
