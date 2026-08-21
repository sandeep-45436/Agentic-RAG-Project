import { Role } from "@/ai/tools/tool-registry";

export interface Capability {
  id: string;
  name: string;
  description: string;
  targetNode: "knowledgeNode" | "databaseNode" | "workflowNode" | "memoryNode";
  supportedTaskTypes: Array<"KNOWLEDGE_LOOKUP" | "DATABASE_QUERY" | "WORKFLOW_EXECUTION">;
  allowedRoles: Role[];
  latencyBudgetMs: number;
  costMetric: number;
}

export class CapabilityRegistry {
  private static capabilities: Map<string, Capability> = new Map();
  private static isInitialized = false;

  public static initialize() {
    if (this.isInitialized) return;

    this.register({
      id: "cap-knowledge-001",
      name: "Knowledge Intelligence Capability",
      description: "Semantic Hybrid RAG, policy handbook lookup, and evidence graph construction",
      targetNode: "knowledgeNode",
      supportedTaskTypes: ["KNOWLEDGE_LOOKUP"],
      allowedRoles: ["OWNER", "ADMIN", "DEAN", "FACULTY", "ADVISOR", "STUDENT", "MEMBER"],
      latencyBudgetMs: 500,
      costMetric: 0.0001,
    });

    this.register({
      id: "cap-database-002",
      name: "University Database Query Capability",
      description: "Structured SQL data lookup, student GPA analytics, and probation roster query",
      targetNode: "databaseNode",
      supportedTaskTypes: ["DATABASE_QUERY"],
      allowedRoles: ["OWNER", "ADMIN", "DEAN", "FACULTY", "ADVISOR"],
      latencyBudgetMs: 300,
      costMetric: 0.00005,
    });

    this.register({
      id: "cap-workflow-003",
      name: "Workflow Action Trigger Capability",
      description: "Automated communication dispatch, email notification, and transcript generation",
      targetNode: "workflowNode",
      supportedTaskTypes: ["WORKFLOW_EXECUTION"],
      allowedRoles: ["OWNER", "ADMIN", "DEAN"],
      latencyBudgetMs: 400,
      costMetric: 0.0002,
    });

    this.register({
      id: "cap-student-ops-005",
      name: "Student Operations Intelligence Capability",
      description: "Student profile, attendance risk prediction, GPA trend trajectory, and personalized academic recommendations",
      targetNode: "databaseNode",
      supportedTaskTypes: ["DATABASE_QUERY"],
      allowedRoles: ["OWNER", "ADMIN", "DEAN", "FACULTY", "ADVISOR", "STUDENT"],
      latencyBudgetMs: 250,
      costMetric: 0.00008,
    });

    this.register({
      id: "cap-examination-ops-006",
      name: "Examination Operations Intelligence Capability",
      description: "Examination eligibility, hall ticket decisions, timetable conflict detection, invigilation optimization, and pass/fail analytics",
      targetNode: "databaseNode",
      supportedTaskTypes: ["DATABASE_QUERY"],
      allowedRoles: ["OWNER", "ADMIN", "DEAN", "FACULTY", "ADVISOR", "STUDENT"],
      latencyBudgetMs: 300,
      costMetric: 0.0001,
    });

    this.isInitialized = true;
  }

  public static register(capability: Capability) {
    this.capabilities.set(capability.id, capability);
  }

  public static getCapabilityForTaskType(
    taskType: "KNOWLEDGE_LOOKUP" | "DATABASE_QUERY" | "WORKFLOW_EXECUTION"
  ): Capability | undefined {
    this.initialize();
    for (const cap of this.capabilities.values()) {
      if (cap.supportedTaskTypes.includes(taskType)) {
        return cap;
      }
    }
    return undefined;
  }

  public static getCapabilitiesForRole(role: Role): Capability[] {
    this.initialize();
    return Array.from(this.capabilities.values()).filter((c) => c.allowedRoles.includes(role));
  }
}
