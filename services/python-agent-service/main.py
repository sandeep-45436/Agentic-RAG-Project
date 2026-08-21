from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from agents.planner_agent import PythonPlannerAgent
from tools.tool_registry import PythonToolRegistry
from runtime.context import ExecutionContextManager
from runtime.registry.runtime_registry import EnterpriseToolRegistry
from runtime.execution.executor import EnterpriseToolRuntime
from runtime.health.health_monitor import HealthMonitor
from runtime.metrics.metrics_collector import MetricsCollector
from runtime.audit.audit_logger import AuditLogger

app = FastAPI(
    title="Smart University Enterprise Tool Runtime (ETR)",
    version="3.0.0",
    description="Enterprise Cognitive Intelligence Platform with Enterprise Tool Runtime (ETR)."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessagePayload(BaseModel):
    role: str
    content: str


class PlanRequestPayload(BaseModel):
    messages: List[ChatMessagePayload]
    organizationId: str
    userId: Optional[str] = None
    userRole: Optional[str] = "ADMIN"
    department: Optional[str] = None


class ETRExecutePayload(BaseModel):
    toolId: str = Field(..., description="Target tool ID")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Input parameters")
    context: Dict[str, Any] = Field(default_factory=dict, description="Execution context attributes")
    version: Optional[str] = Field(None, description="Optional requested tool version")


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "Smart University Enterprise Tool Runtime (ETR)",
        "version": "3.0.0"
    }


@app.post("/api/plan")
def generate_plan(payload: PlanRequestPayload):
    try:
        state = {
            "messages": [{"role": m.role, "content": m.content} for m in payload.messages],
            "organizationId": payload.organizationId,
            "userId": payload.userId or "anon",
            "userRole": payload.userRole or "ADMIN",
            "department": payload.department,
        }

        result = PythonPlannerAgent.execute(state)
        return {
            "success": True,
            "plan": result["plan"],
            "routedPath": result["routedPath"],
        }
    except Exception as e:
        print(f"[FastAPI] Planning error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tools")
def list_tools(role: str = "ADMIN"):
    tools = PythonToolRegistry.get_tools_for_role(role)
    return {"role": role, "tools": tools}


# ── ENTERPRISE TOOL RUNTIME (ETR) ENDPOINTS ─────────────────────────────────────

@app.get("/api/etr/tools")
def etr_discover_tools(role: str = "MEMBER", organizationId: str = "seed-org-001", department: Optional[str] = None):
    ctx_data = {"userRole": role, "organizationId": organizationId, "department": department}
    context = ExecutionContextManager.create_context(ctx_data)
    tools = EnterpriseToolRegistry.discover_tools(context)
    return {
        "success": True,
        "context": {
            "userRole": context.user_role,
            "organizationId": context.organization_id,
            "department": context.department
        },
        "discoveredTools": tools
    }


@app.post("/api/etr/execute")
def etr_execute_tool(req: ETRExecutePayload):
    try:
        result = EnterpriseToolRuntime.execute_tool(
            tool_id=req.toolId,
            payload=req.payload,
            context_data=req.context,
            requested_version=req.version
        )
        return result.model_dump()
    except Exception as e:
        print(f"[ETR.FastAPI] Execution Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/etr/health")
def etr_health():
    all_tools = EnterpriseToolRegistry.get_all_tools()
    return HealthMonitor.check_health(all_tools)


@app.get("/api/etr/metrics")
def etr_metrics():
    return MetricsCollector.get_summary()


@app.get("/api/etr/audit")
def etr_audit_logs(limit: int = 50):
    return {"logs": AuditLogger.get_recent_logs(limit)}


if __name__ == "__main__":
    import uvicorn
    from config import HOST, PORT
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
