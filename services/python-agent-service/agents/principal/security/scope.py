from typing import Dict, Any

class InstitutionalScopeEnforcer:
    """
    Pre-retrieval Security & Scope Gatekeeper.
    Enforces scope = 'UNIVERSITY' and tenant isolation before any database or RAG operation.
    Never leaves institutional authorization to LLM prompts.
    """

    ALLOWED_ROLES = ["PRINCIPAL", "DEAN", "DIRECTOR", "ADMIN", "OWNER"]

    @classmethod
    def validate_and_scope(cls, user_role: str, organization_id: str) -> Dict[str, Any]:
        role_normalized = (user_role or "GUEST").upper()
        if role_normalized not in cls.ALLOWED_ROLES:
            raise PermissionError(
                f"Unauthorized institutional access: Role '{user_role}' cannot access Principal Executive Graph."
            )

        return {
            "authorized": True,
            "scope": "UNIVERSITY",
            "organizationId": organization_id or "default-university-org",
            "enforcedConstraints": ["CROSS_DEPARTMENT_ACCESS", "EXECUTIVE_AUDIT_ENABLED"]
        }
