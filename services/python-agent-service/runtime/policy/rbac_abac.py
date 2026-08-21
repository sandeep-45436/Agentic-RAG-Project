from typing import Dict, Any, List
from runtime.context import ExecutionContext
from runtime.base_tool import ToolMetadata


class RBACEvaluator:
    """Layer 1: Role-Based Access Control Evaluation."""
    
    ROLE_HIERARCHY = {
        "OWNER": ["OWNER", "ADMIN", "DEAN", "FACULTY", "ADVISOR", "STUDENT", "MEMBER"],
        "ADMIN": ["ADMIN", "DEAN", "FACULTY", "ADVISOR", "STUDENT", "MEMBER"],
        "DEAN": ["DEAN", "FACULTY", "ADVISOR", "STUDENT", "MEMBER"],
        "FACULTY": ["FACULTY", "ADVISOR", "STUDENT", "MEMBER"],
        "ADVISOR": ["ADVISOR", "STUDENT", "MEMBER"],
        "STUDENT": ["STUDENT", "MEMBER"],
        "MEMBER": ["MEMBER"],
    }

    @classmethod
    def evaluate(cls, context: ExecutionContext, metadata: ToolMetadata) -> tuple[bool, str]:
        if not metadata.required_permissions:
            return True, "No permissions required for tool."

        user_role = (context.user_role or "MEMBER").upper()
        allowed_roles = [r.upper() for r in metadata.required_permissions]

        # Expand user role capabilities
        user_capabilities = cls.ROLE_HIERARCHY.get(user_role, [user_role])

        # Check intersection
        has_access = any(cap in allowed_roles for cap in user_capabilities)
        if has_access:
            return True, f"RBAC check passed for role '{user_role}'."

        return False, f"Role '{user_role}' does not have required permissions: {metadata.required_permissions}"


class ABACEvaluator:
    """Layer 2: Attribute-Based Access Control Evaluation."""

    @classmethod
    def evaluate(cls, context: ExecutionContext, metadata: ToolMetadata, payload: Dict[str, Any]) -> tuple[bool, str]:
        # Rule 1: Organization Isolation
        target_org = payload.get("organizationId") or context.organization_id
        if target_org and target_org != context.organization_id and context.user_role.upper() not in ["OWNER", "ADMIN"]:
            return False, f"ABAC Violation: User org '{context.organization_id}' cannot access target org '{target_org}'."

        # Rule 2: Department Isolation for Faculty / Advisor level tools if requested
        requested_dept = payload.get("department")
        if requested_dept and context.department:
            if requested_dept.lower() != context.department.lower() and context.user_role.upper() not in ["OWNER", "ADMIN", "DEAN"]:
                return False, f"ABAC Violation: User department '{context.department}' does not match target department '{requested_dept}'."

        return True, "ABAC attribute checks passed."
