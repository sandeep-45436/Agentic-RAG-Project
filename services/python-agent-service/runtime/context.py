import time
import uuid
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class ExecutionContext(BaseModel):
    organization_id: str = Field(..., description="Target organization ID")
    workspace_id: Optional[str] = Field(None, description="Workspace ID")
    user_id: str = Field("anon", description="Invoking user ID")
    user_role: str = Field("MEMBER", description="User primary role")
    department: Optional[str] = Field(None, description="User department code/name")
    semester: Optional[str] = Field("Fall 2026", description="Academic term/semester")
    conversation_id: Optional[str] = Field(None, description="Conversation ID")
    session_id: Optional[str] = Field(None, description="Session ID")
    trace_id: str = Field(default_factory=lambda: f"etr-trace-{uuid.uuid4().hex[:12]}")
    correlation_id: str = Field(default_factory=lambda: f"corr-{uuid.uuid4().hex[:12]}")
    request_timestamp: float = Field(default_factory=time.time)
    permissions: List[str] = Field(default_factory=list)
    locale: str = Field("en-US")
    timezone: str = Field("UTC")
    planner_decision_id: Optional[str] = Field(None)


class ExecutionContextManager:
    @staticmethod
    def create_context(state: Dict[str, Any]) -> ExecutionContext:
        """Helper to create ExecutionContext from state dict or request payload."""
        return ExecutionContext(
            organization_id=state.get("organizationId", "seed-org-001"),
            workspace_id=state.get("workspaceId"),
            user_id=state.get("userId", "anon"),
            user_role=state.get("userRole", "MEMBER"),
            department=state.get("department"),
            semester=state.get("semester", "Fall 2026"),
            conversation_id=state.get("conversationId"),
            session_id=state.get("sessionId"),
            trace_id=state.get("traceId", f"etr-trace-{uuid.uuid4().hex[:12]}"),
            correlation_id=state.get("correlationId", f"corr-{uuid.uuid4().hex[:12]}"),
            request_timestamp=state.get("timestamp", time.time()),
            permissions=state.get("permissions", []),
            planner_decision_id=state.get("plannerDecisionId"),
        )
