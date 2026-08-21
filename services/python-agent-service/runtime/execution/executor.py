import time
from typing import Dict, Any, Optional
from runtime.base_tool import ToolResult
from runtime.context import ExecutionContext, ExecutionContextManager
from runtime.registry.runtime_registry import EnterpriseToolRegistry
from runtime.policy.policy_engine import PolicyEngine
from runtime.validation.validator import ValidationEngine
from runtime.execution.timeout import TimeoutManager
from runtime.execution.retry import RetryManager
from runtime.audit.audit_logger import AuditLogger
from runtime.metrics.metrics_collector import MetricsCollector
from runtime.version.version_manager import VersionManager


class EnterpriseToolRuntime:
    @classmethod
    def execute_tool(
        cls,
        tool_id: str,
        payload: Dict[str, Any],
        context_data: Optional[Dict[str, Any]] = None,
        requested_version: Optional[str] = None,
    ) -> ToolResult:
        start_time = time.time()
        
        # 1. Inject Execution Context
        context = ExecutionContextManager.create_context(context_data or {})
        
        # 2. Discover Tool & Resolve Version
        all_tools = EnterpriseToolRegistry.get_all_tools()
        try:
            tool, version = VersionManager.resolve_tool_version(tool_id, requested_version, all_tools)
        except ValueError as ve:
            exec_time = (time.time() - start_time) * 1000.0
            MetricsCollector.record_execution(tool_id, False, exec_time, error_type="not_found")
            return ToolResult(
                success=False,
                status="FAILURE",
                errors=[str(ve)],
                execution_time_ms=round(exec_time, 2),
                trace_id=context.trace_id,
            )

        metadata = tool.metadata

        # 3. Policy Engine Authorization Check (RBAC + ABAC)
        policy_decision = PolicyEngine.authorize(context, metadata, payload)
        if not policy_decision.allowed:
            exec_time = (time.time() - start_time) * 1000.0
            AuditLogger.log_invocation(
                tool_id=tool_id,
                version=version,
                context=context,
                status="FORBIDDEN",
                execution_time_ms=exec_time,
                retries=0,
                details={"reason": policy_decision.reason},
            )
            MetricsCollector.record_execution(tool_id, False, exec_time, error_type="authorization")
            return ToolResult(
                success=False,
                status="FAILURE",
                errors=[f"Authorization Denied: {policy_decision.reason}"],
                execution_time_ms=round(exec_time, 2),
                tool_version=version,
                trace_id=context.trace_id,
            )

        # 4. Validate Input Schema
        input_valid, input_errors = ValidationEngine.validate_input(metadata, payload)
        if not input_valid:
            exec_time = (time.time() - start_time) * 1000.0
            AuditLogger.log_invocation(
                tool_id=tool_id,
                version=version,
                context=context,
                status="INVALID_INPUT",
                execution_time_ms=exec_time,
                retries=0,
                details={"errors": input_errors},
            )
            MetricsCollector.record_execution(tool_id, False, exec_time, error_type="validation")
            return ToolResult(
                success=False,
                status="FAILURE",
                errors=input_errors,
                execution_time_ms=round(exec_time, 2),
                tool_version=version,
                trace_id=context.trace_id,
            )

        # 5. Execute Tool with Timeout & Retry Policies
        def _target_exec():
            return TimeoutManager.execute_with_timeout(
                func=tool.execute,
                payload=payload,
                context=context,
                timeout_seconds=metadata.timeout_seconds,
            )

        try:
            raw_output, retry_count, retry_warnings = RetryManager.execute_with_retry(
                func=_target_exec,
                max_retries=metadata.retry_count,
            )
        except Exception as exec_err:
            exec_time = (time.time() - start_time) * 1000.0
            AuditLogger.log_invocation(
                tool_id=tool_id,
                version=version,
                context=context,
                status="EXECUTION_ERROR",
                execution_time_ms=exec_time,
                retries=0,
                details={"error": str(exec_err)},
            )
            MetricsCollector.record_execution(tool_id, False, exec_time, error_type="execution")
            return ToolResult(
                success=False,
                status="FAILURE",
                errors=[f"Tool Execution Error: {str(exec_err)}"],
                execution_time_ms=round(exec_time, 2),
                tool_version=version,
                trace_id=context.trace_id,
            )

        # 6. Validate Output Schema
        output_valid, output_errors = ValidationEngine.validate_output(metadata, raw_output)
        exec_time = (time.time() - start_time) * 1000.0

        if not output_valid:
            AuditLogger.log_invocation(
                tool_id=tool_id,
                version=version,
                context=context,
                status="INVALID_OUTPUT",
                execution_time_ms=exec_time,
                retries=retry_count,
                details={"errors": output_errors},
            )
            MetricsCollector.record_execution(tool_id, False, exec_time, error_type="validation")
            return ToolResult(
                success=False,
                status="FAILURE",
                errors=output_errors,
                execution_time_ms=round(exec_time, 2),
                tool_version=version,
                trace_id=context.trace_id,
            )

        # 7. Audit & Metrics Log Success
        AuditLogger.log_invocation(
            tool_id=tool_id,
            version=version,
            context=context,
            status="SUCCESS",
            execution_time_ms=exec_time,
            retries=retry_count,
            details={"input": payload},
        )
        MetricsCollector.record_execution(tool_id, True, exec_time)

        # 8. Return Standardized ToolResult
        return ToolResult(
            success=True,
            status="SUCCESS",
            data=raw_output,
            execution_time_ms=round(exec_time, 2),
            tool_version=version,
            warnings=retry_warnings,
            trace_id=context.trace_id,
            metadata={
                "category": metadata.category,
                "owner": metadata.owner,
                "retries": retry_count,
            },
        )
