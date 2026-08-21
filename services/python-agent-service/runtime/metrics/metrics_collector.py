from typing import Dict, Any


class MetricsCollector:
    _metrics = {
        "total_executions": 0,
        "successful_executions": 0,
        "failed_executions": 0,
        "authorization_failures": 0,
        "validation_failures": 0,
        "total_execution_time_ms": 0.0,
        "tool_metrics": {},
    }

    @classmethod
    def record_execution(
        cls,
        tool_id: str,
        success: bool,
        execution_time_ms: float,
        error_type: str = None,
    ):
        cls._metrics["total_executions"] += 1
        cls._metrics["total_execution_time_ms"] += execution_time_ms

        if success:
            cls._metrics["successful_executions"] += 1
        else:
            cls._metrics["failed_executions"] += 1
            if error_type == "authorization":
                cls._metrics["authorization_failures"] += 1
            elif error_type == "validation":
                cls._metrics["validation_failures"] += 1

        if tool_id not in cls._metrics["tool_metrics"]:
            cls._metrics["tool_metrics"][tool_id] = {
                "invocations": 0,
                "successes": 0,
                "failures": 0,
                "total_time_ms": 0.0,
            }

        tm = cls._metrics["tool_metrics"][tool_id]
        tm["invocations"] += 1
        tm["total_time_ms"] += execution_time_ms
        if success:
            tm["successes"] += 1
        else:
            tm["failures"] += 1

    @classmethod
    def get_summary(cls) -> Dict[str, Any]:
        avg_time = (
            cls._metrics["total_execution_time_ms"] / cls._metrics["total_executions"]
            if cls._metrics["total_executions"] > 0
            else 0.0
        )
        return {
            "totalExecutions": cls._metrics["total_executions"],
            "successfulExecutions": cls._metrics["successful_executions"],
            "failedExecutions": cls._metrics["failed_executions"],
            "authorizationFailures": cls._metrics["authorization_failures"],
            "validationFailures": cls._metrics["validation_failures"],
            "avgExecutionTimeMs": round(avg_time, 2),
            "toolMetrics": cls._metrics["tool_metrics"],
        }
