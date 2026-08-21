import uuid
from typing import Dict, Any
from runtime.context import ExecutionContextManager
from runtime.registry.runtime_registry import EnterpriseToolRegistry
from agents.task_decomposer import PythonTaskDecomposer


class PythonPlannerAgent:
    @classmethod
    def execute(cls, state: Dict[str, Any]) -> Dict[str, Any]:
        messages = state.get("messages", [])
        if not messages:
            return {"plan": None, "routedPath": "KNOWLEDGE"}

        latest_msg = messages[-1]
        user_query = latest_msg.get("content", "").strip()

        # ETR Context Discovery
        context = ExecutionContextManager.create_context(state)
        authorized_tools = EnterpriseToolRegistry.discover_tools(context)
        tool_ids = [t["toolId"] for t in authorized_tools]

        query_lower = user_query.lower()
        raw_steps = []
        selected_agents = []
        selected_tools = []
        complexity = "low"

        if ("probation" in query_lower or "gpa" in query_lower or "tuition" in query_lower or "student" in query_lower) and "university_database_query" in tool_ids:
            complexity = "medium"
            raw_steps.append({"type": "DATABASE_QUERY", "query": f"Query database for {user_query}"})
            selected_agents.append("DatabaseAgent")
            selected_tools.append("university_database_query")
            routed_path = "DATABASE"

        elif ("policy" in query_lower or "rules" in query_lower or "handbook" in query_lower or "syllabus" in query_lower) and "knowledge_retrieval" in tool_ids:
            complexity = "low"
            raw_steps.append({"type": "KNOWLEDGE_LOOKUP", "query": user_query})
            selected_agents.append("KnowledgeAgent")
            selected_tools.append("knowledge_retrieval")
            routed_path = "KNOWLEDGE"

        elif ("email" in query_lower or "alert" in query_lower or "notify" in query_lower) and "workflow_action_execution" in tool_ids:
            complexity = "high"
            raw_steps.append({"type": "DATABASE_QUERY", "query": "Retrieve target list for action"})
            raw_steps.append({"type": "WORKFLOW_EXECUTION", "query": "Dispatch action alert"})
            selected_agents.extend(["DatabaseAgent", "WorkflowAgent"])
            selected_tools.extend(["university_database_query", "workflow_action_execution"])
            routed_path = "DATABASE"

        else:
            complexity = "low"
            raw_steps.append({"type": "KNOWLEDGE_LOOKUP", "query": user_query})
            selected_agents.append("KnowledgeAgent")
            selected_tools.append("knowledge_retrieval")
            routed_path = "KNOWLEDGE"

        sub_tasks = PythonTaskDecomposer.decompose_goal(user_query, raw_steps)

        plan = {
            "goal": user_query,
            "complexity": complexity,
            "agents": list(set(selected_agents)),
            "tools": list(set(selected_tools)),
            "availableCapabilityCount": len(authorized_tools),
            "subTasks": sub_tasks,
            "currentStepIndex": 0,
            "isComplete": False
        }

        print(f"[PythonPlannerAgent] ETR Plan compiled for role '{context.user_role}' with {len(sub_tasks)} sub-task(s)! Route: {routed_path}")

        return {
            "plan": plan,
            "routedPath": routed_path
        }
