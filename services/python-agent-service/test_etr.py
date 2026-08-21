import sys
import os

# Add service root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from runtime.context import ExecutionContext
from runtime.registry.runtime_registry import EnterpriseToolRegistry
from runtime.execution.executor import EnterpriseToolRuntime
from runtime.health.health_monitor import HealthMonitor
from runtime.metrics.metrics_collector import MetricsCollector
from runtime.audit.audit_logger import AuditLogger
from agents.planner_agent import PythonPlannerAgent


def test_etr_pipeline():
    print("\n--- STARTING ENTERPRISE TOOL RUNTIME (ETR) TEST SUITE ---\n")

    # 1. Initialize Registry
    EnterpriseToolRegistry.initialize()
    all_tools = EnterpriseToolRegistry.get_all_tools()
    print(f"[OK] Registry initialized with {len(all_tools)} tools.")
    assert len(all_tools) >= 5, "Expected at least 5 registered tools"

    # 2. Test Discovery for STUDENT role vs ADMIN role
    student_ctx = ExecutionContext(organization_id="seed-org-001", user_role="STUDENT")
    student_tools = EnterpriseToolRegistry.discover_tools(student_ctx)
    print(f"[OK] Student Discovered Tools: {[t['toolId'] for t in student_tools]}")

    # 3. Test Authorized Tool Execution (Knowledge Retrieval)
    res_knowledge = EnterpriseToolRuntime.execute_tool(
        tool_id="knowledge_retrieval",
        payload={"query": "academic probation policy"},
        context_data={"userRole": "STUDENT", "organizationId": "seed-org-001"}
    )
    print(f"[OK] Knowledge Tool Result (Status: {res_knowledge.status}): {res_knowledge.data['chunks'][0]['documentName']}")
    assert res_knowledge.success is True, "Knowledge tool should succeed for STUDENT"

    # 4. Test RBAC Forbidden Execution (STUDENT calling Admin Operations)
    res_admin_forbidden = EnterpriseToolRuntime.execute_tool(
        tool_id="admin_operations",
        payload={"operation": "reset_system"},
        context_data={"userRole": "STUDENT", "organizationId": "seed-org-001"}
    )
    print(f"[OK] RBAC Check Blocked Unauthorized Call: {res_admin_forbidden.errors[0]}")
    assert res_admin_forbidden.success is False, "Admin tool should fail for STUDENT"
    assert res_admin_forbidden.status == "FAILURE"

    # 5. Test Authorized Admin Tool Execution (ADMIN calling Admin Operations)
    res_admin_allowed = EnterpriseToolRuntime.execute_tool(
        tool_id="admin_operations",
        payload={"operation": "system_health_check"},
        context_data={"userRole": "ADMIN", "organizationId": "seed-org-001"}
    )
    print(f"[OK] Authorized Admin Call Succeeded: {res_admin_allowed.data['result']}")
    assert res_admin_allowed.success is True

    # 6. Test ABAC Department Isolation Violation
    res_abac_violation = EnterpriseToolRuntime.execute_tool(
        tool_id="university_database_query",
        payload={"operation": "probation_students", "department": "PHYSICS"},
        context_data={"userRole": "FACULTY", "organizationId": "seed-org-001", "department": "CS"}
    )
    print(f"[OK] ABAC Check Blocked Cross-Department Violation: {res_abac_violation.errors[0]}")
    assert res_abac_violation.success is False

    # 7. Test Input Validation Failure
    res_invalid_input = EnterpriseToolRuntime.execute_tool(
        tool_id="knowledge_retrieval",
        payload={}, # missing required 'query'
        context_data={"userRole": "STUDENT", "organizationId": "seed-org-001"}
    )
    print(f"[OK] Validation Engine Caught Missing Input: {res_invalid_input.errors[0]}")
    assert res_invalid_input.success is False

    # 8. Test Planner Integration
    planner_state = {
        "messages": [{"role": "user", "content": "Which students are on academic probation?"}],
        "organizationId": "seed-org-001",
        "userRole": "ADMIN"
    }
    planner_output = PythonPlannerAgent.execute(planner_state)
    print(f"[OK] Planner ETR Integration Success! Routed Path: {planner_output['routedPath']}, Goal: {planner_output['plan']['goal']}")

    # 9. Verify Health & Metrics Summary
    health = HealthMonitor.check_health(all_tools)
    metrics = MetricsCollector.get_summary()
    recent_logs = AuditLogger.get_recent_logs()

    print(f"\n--- ETR HEALTH & METRICS SUMMARY ---")
    print(f"  Health Status: {health['status']} ({health['activeTools']}/{health['totalTools']} active tools)")
    print(f"  Total Invocations: {metrics['totalExecutions']} (Success: {metrics['successfulExecutions']}, Failures: {metrics['failedExecutions']})")
    print(f"  Auth Blocked Calls: {metrics['authorizationFailures']}")
    print(f"  Validation Errors Caught: {metrics['validationFailures']}")
    print(f"  Audit Event Log Count: {len(recent_logs)}")
    print("\nALL ENTERPRISE TOOL RUNTIME (ETR) VERIFICATION TESTS PASSED!\n")


if __name__ == "__main__":
    test_etr_pipeline()
