import logging
from typing import Dict, Any, List, Optional
from runtime.base_tool import AbstractBaseTool
from runtime.context import ExecutionContext
from runtime.policy.rbac_abac import RBACEvaluator

logger = logging.getLogger("ETR.RuntimeRegistry")


class EnterpriseToolRegistry:
    _tools: Dict[str, AbstractBaseTool] = {}
    _initialized: bool = False

    @classmethod
    def register_tool(cls, tool: AbstractBaseTool) -> None:
        tool_id = tool.metadata.tool_id
        cls._tools[tool_id] = tool
        logger.info(f"[ETR.Registry] Registered tool: {tool_id} (v{tool.metadata.version}, Category: {tool.metadata.category})")

    @classmethod
    def initialize(cls) -> None:
        if cls._initialized:
            return

        from runtime.tools.knowledge.hybrid_rag_tool import HybridRAGTool
        from runtime.tools.database.university_db_tool import UniversityDatabaseTool
        from runtime.tools.workflow.workflow_action_tool import WorkflowActionTool
        from runtime.tools.analytics.analytics_report_tool import AnalyticsReportTool
        from runtime.tools.admin.admin_operations_tool import AdminOperationsTool

        cls.register_tool(HybridRAGTool())
        cls.register_tool(UniversityDatabaseTool())
        cls.register_tool(WorkflowActionTool())
        cls.register_tool(AnalyticsReportTool())
        cls.register_tool(AdminOperationsTool())

        cls._initialized = True
        print(f"[ETR.RuntimeRegistry] Enterprise Tool Runtime initialized with {len(cls._tools)} registered tools.")

    @classmethod
    def get_tool(cls, tool_id: str) -> Optional[AbstractBaseTool]:
        cls.initialize()
        return cls._tools.get(tool_id)

    @classmethod
    def discover_tools(cls, context: ExecutionContext) -> List[Dict[str, Any]]:
        cls.initialize()
        authorized = []
        for tool in cls._tools.values():
            meta = tool.metadata
            rbac_ok, _ = RBACEvaluator.evaluate(context, meta)
            if rbac_ok and meta.status == "ACTIVE":
                authorized.append({
                    "toolId": meta.tool_id,
                    "version": meta.version,
                    "name": meta.name,
                    "description": meta.description,
                    "category": meta.category,
                    "owner": meta.owner,
                    "inputSchema": meta.input_schema,
                    "outputSchema": meta.output_schema,
                    "requiredPermissions": meta.required_permissions,
                })
        return authorized

    @classmethod
    def get_all_tools(cls) -> Dict[str, AbstractBaseTool]:
        cls.initialize()
        return cls._tools
