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
      normalizedGoal: "GET_STUDENT_RISK_PROBATION",
      queryText: "Students on probation with attendance below 75%",
      decisionMade: "Route to DatabaseAgent for student risk aggregation",
      outcomeStatus: "SUCCESS",
      lessonLearned: "Prune KnowledgeAgent lookup when query targets pure student DB records",
      timestamp: new Date().toISOString(),
    },
    {
      id: "mem-002",
      normalizedGoal: "GET_STUDENT_ATTENDANCE",
      queryText: "Generate hall ticket for student with 65% attendance",
      decisionMade: "Block execution due to POL-001 attendance violation",
      outcomeStatus: "POLICY_VIOLATION",
      lessonLearned: "Recommend advisor review immediately when attendance < 75%",
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
