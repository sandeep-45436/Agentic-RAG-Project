from typing import List, Dict, Any
from runtime.context import ExecutionContext
from runtime.registry.runtime_registry import EnterpriseToolRegistry
from runtime.execution.executor import EnterpriseToolRuntime


class PythonToolRegistry:
    """Legacy compatibility wrapper delegating to Enterprise Tool Runtime (ETR)."""

    @classmethod
    def initialize(cls):
        EnterpriseToolRegistry.initialize()

    @classmethod
    def get_tools_for_role(cls, role: str) -> List[Dict[str, str]]:
        context = ExecutionContext(organization_id="seed-org-001", user_role=role)
        discovered = EnterpriseToolRegistry.discover_tools(context)
        return [{"name": d["toolId"], "description": d["description"]} for d in discovered]

    @classmethod
    def execute_tool(cls, tool_name: str, input_payload: Dict[str, Any], role: str = "MEMBER") -> Dict[str, Any]:
        context_data = {"userRole": role, "organizationId": "seed-org-001"}
        result = EnterpriseToolRuntime.execute_tool(tool_name, input_payload, context_data)
        if not result.success:
            err_msg = "; ".join(result.errors) if result.errors else "Execution failed."
            if result.status == "FORBIDDEN":
                raise PermissionError(err_msg)
            raise RuntimeError(err_msg)
        return result.data
