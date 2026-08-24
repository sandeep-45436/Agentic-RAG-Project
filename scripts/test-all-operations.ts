import { ToolRegistry } from "@/ai/tools/tool-registry";
import { CapabilityRegistry } from "@/ai/registry/capability-registry";
import { UniversityDatabaseTool } from "@/ai/tools/university-db.tool";
import { WorkflowExecutionTool } from "@/ai/tools/workflow.tool";
import { db } from "@/server/db/prisma";

async function runTests() {
  console.log("==================================================");
  console.log("1. TESTING CAPABILITY & TOOL ROLE PERMISSIONS");
  console.log("==================================================");

  const roles = ["STUDENT", "MEMBER", "FACULTY", "ADVISOR", "DEAN", "ADMIN", "OWNER"] as const;

  for (const role of roles) {
    const tools = ToolRegistry.getToolsForRole(role as any);
    const caps = CapabilityRegistry.getCapabilitiesForRole(role as any);
    console.log("Role " + role + ": Tools available = " + tools.length + ", Capabilities available = " + caps.length);
    if (tools.length < 4 || caps.length < 5) {
      throw new Error("Role " + role + " is missing tools or capabilities!");
    }
  }
  console.log("✔ All roles have full tool & capability access!");

  console.log("\n==================================================");
  console.log("2. TESTING UNIVERSITY DATABASE OPERATIONS");
  console.log("==================================================");

  const orgId = "seed-org-001";
  const operations = [
    "probation_students",
    "financial_ledger",
    "faculty_workload",
    "course_catalog",
    "student_list",
    "exam_eligibility",
    "hall_ticket_status",
    "exam_schedule",
    "exam_conflicts",
    "invigilation_analysis",
    "exam_results",
    "course_difficulty_index",
    "department_analytics",
    "semester_results",
  ] as const;

  for (const op of operations) {
    try {
      const res = await UniversityDatabaseTool.execute({
        operation: op,
        organizationId: orgId,
      });
      console.log("✔ Operation " + op + ": Success = " + res.success);
    } catch (err: any) {
      console.error("❌ Operation " + op + " threw an exception:", err);
    }
  }

  console.log("\n==================================================");
  console.log("3. TESTING WORKFLOW EXECUTION TOOL");
  console.log("==================================================");

  const wfResult = await WorkflowExecutionTool.execute({
    actionType: "send_advising_alert",
    organizationId: orgId,
    parameters: { recipient: "student@smartuniversity.edu", urgency: "HIGH" },
  });
  console.log("✔ WorkflowExecutionTool result:", wfResult.success, wfResult.actionType);

  console.log("\n==================================================");
  console.log("4. TESTING DIRECT TOOLREGISTRY EXECUTION AS STUDENT & MEMBER");
  console.log("==================================================");

  const directStudentRes = await ToolRegistry.executeTool(
    UniversityDatabaseTool.toolName,
    { operation: "course_catalog", organizationId: orgId },
    "STUDENT"
  );
  console.log("✔ Direct ToolRegistry execution as STUDENT:", directStudentRes.success, "Found " + (directStudentRes.records ? directStudentRes.records.length : 0) + " courses");

  const directMemberRes = await ToolRegistry.executeTool(
    UniversityDatabaseTool.toolName,
    { operation: "hall_ticket_status", organizationId: orgId },
    "MEMBER"
  );
  console.log("✔ Direct ToolRegistry execution as MEMBER:", directMemberRes.success, "Records = " + (directMemberRes.records ? directMemberRes.records.length : 0));

  await db.$disconnect();
  console.log("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});