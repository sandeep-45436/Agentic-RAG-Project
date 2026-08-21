import time
import json
import logging
from typing import Dict, Any
from runtime.context import ExecutionContext

logger = logging.getLogger("ETR.AuditLogger")


class AuditLogger:
    _events = []

    @classmethod
    def log_invocation(
        cls,
        tool_id: str,
        version: str,
        context: ExecutionContext,
        status: str,
        execution_time_ms: float,
        retries: int,
        details: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        event = {
            "timestamp": time.time(),
            "tool_id": tool_id,
            "version": version,
            "user_id": context.user_id,
            "user_role": context.user_role,
            "organization_id": context.organization_id,
            "trace_id": context.trace_id,
            "correlation_id": context.correlation_id,
            "status": status,
            "execution_time_ms": execution_time_ms,
            "retries": retries,
            "details": details or {},
        }
        cls._events.append(event)
        if len(cls._events) > 500:
            cls._events.pop(0)

        print(f"[ETR.AuditLogger] AUDIT RECORDED: {tool_id} (Status: {status}, Trace: {context.trace_id})")
        return event

    @classmethod
    def get_recent_logs(cls, limit: int = 50) -> list:
        return cls._events[-limit:]
