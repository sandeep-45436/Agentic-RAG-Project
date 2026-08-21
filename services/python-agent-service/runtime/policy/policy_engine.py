from typing import Dict, Any
from runtime.context import ExecutionContext
from runtime.base_tool import ToolMetadata
from runtime.policy.rbac_abac import RBACEvaluator, ABACEvaluator


class PolicyEngineDecision:
    def __init__(self, allowed: bool, reason: str, rbac_passed: bool, abac_passed: bool):
        self.allowed = allowed
        self.reason = reason
        self.rbac_passed = rbac_passed
        self.abac_passed = abac_passed


class PolicyEngine:
    @classmethod
    def authorize(cls, context: ExecutionContext, metadata: ToolMetadata, payload: Dict[str, Any]) -> PolicyEngineDecision:
        # Layer 1: RBAC
        rbac_ok, rbac_msg = RBACEvaluator.evaluate(context, metadata)
        if not rbac_ok:
            return PolicyEngineDecision(allowed=False, reason=rbac_msg, rbac_passed=False, abac_passed=False)

        # Layer 2: ABAC
        abac_ok, abac_msg = ABACEvaluator.evaluate(context, metadata, payload)
        if not abac_ok:
            return PolicyEngineDecision(allowed=False, reason=abac_msg, rbac_passed=True, abac_passed=False)

        return PolicyEngineDecision(allowed=True, reason="Authorization successful.", rbac_passed=True, abac_passed=True)
