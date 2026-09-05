import { KnowledgeTool } from "./knowledge.tool";
import { UniversityDatabaseTool } from "./university-db.tool";
import { WorkflowExecutionTool } from "./workflow.tool";
import { DocumentDeliveryTool } from "./document-delivery.tool";
import { ResearchNotebookTool } from "./research-notebook.tool";

export type Role = "OWNER" | "ADMIN" | "DEAN" | "FACULTY" | "ADVISOR" | "STUDENT" | "MEMBER";

export interface RegisteredTool {
  name: string;
  description: string;
  schema: any;
  allowedRoles: Role[];
  execute: (input: any) => Promise<any>;
}

export class ToolRegistry {
  private static tools: Map<string, RegisteredTool> = new Map();
  private static isInitialized = false;

  public static initialize() {
    if (this.isInitialized) return;

    // Register Knowledge Tool (Available to all roles)
    this.register({
      name: KnowledgeTool.toolName,
      description: KnowledgeTool.description,
      schema: KnowledgeTool.schema,
      allowedRoles: ["OWNER", "ADMIN", "DEAN", "FACULTY", "ADVISOR", "STUDENT", "MEMBER"],
      execute: KnowledgeTool.execute,
    });

    // Register University Database Tool (Available to all authorized roles)
    this.register({
      name: UniversityDatabaseTool.toolName,
      description: UniversityDatabaseTool.description,
      schema: UniversityDatabaseTool.schema,
      allowedRoles: ["OWNER", "ADMIN", "DEAN", "FACULTY", "ADVISOR", "STUDENT", "MEMBER"],
      execute: UniversityDatabaseTool.execute,
    });

    // Register Workflow Execution Tool (Available to all roles)
    this.register({
      name: WorkflowExecutionTool.toolName,
      description: WorkflowExecutionTool.description,
      schema: WorkflowExecutionTool.schema,
      allowedRoles: ["OWNER", "ADMIN", "DEAN", "FACULTY", "ADVISOR", "STUDENT", "MEMBER"],
      execute: WorkflowExecutionTool.execute,
    });

    // Register Document Delivery Tool (Available to all roles; enforces its own enrollment-based access control)
    this.register({
      name: DocumentDeliveryTool.toolName,
      description: DocumentDeliveryTool.description,
      schema: DocumentDeliveryTool.schema,
      allowedRoles: ["OWNER", "ADMIN", "DEAN", "FACULTY", "ADVISOR", "STUDENT", "MEMBER"],
      execute: DocumentDeliveryTool.execute,
    });

    // Register Research Notebook Tool — deep multi-document research via provider abstraction
    // Not for normal knowledge retrieval; planner routes only explicit research requests here
    this.register({
      name: ResearchNotebookTool.toolName,
      description: ResearchNotebookTool.description,
      schema: ResearchNotebookTool.schema,
      allowedRoles: ["OWNER", "ADMIN", "DEAN", "FACULTY", "ADVISOR", "STUDENT", "MEMBER"],
      execute: ResearchNotebookTool.execute,
    });

    this.isInitialized = true;
    console.log(`[ToolRegistry] Initialized with ${this.tools.size} enterprise tools.`);
  }

  public static register(tool: RegisteredTool) {
    this.tools.set(tool.name, tool);
  }

  public static getToolsForRole(role: Role): RegisteredTool[] {
    this.initialize();
    return Array.from(this.tools.values()).filter((tool) =>
      tool.allowedRoles.includes(role)
    );
  }

  public static async executeTool(toolName: string, input: any, role: Role = "MEMBER"): Promise<any> {
    this.initialize();
    const tool = this.tools.get(toolName);

    if (!tool) {
      throw new Error(`[ToolRegistry] Tool '${toolName}' not found in registry.`);
    }

    if (!tool.allowedRoles.includes(role)) {
      throw new Error(`[ToolRegistry] Permission denied: Role '${role}' is not authorized to execute tool '${toolName}'.`);
    }

    console.log(`[ToolRegistry] Executing tool '${toolName}' for authorized role '${role}'`);
    return tool.execute(input);
  }
}
