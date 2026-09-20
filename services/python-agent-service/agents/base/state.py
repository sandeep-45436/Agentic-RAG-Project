from typing import List, Dict, Any, Optional
from typing_extensions import TypedDict

class BaseAgentState(TypedDict, total=False):
    """
    Common Base State for all NexusIQ role-specialized LangGraph agents.
    Provides standard enterprise audit, provenance, and execution trace plumbing.
    """
    # ── Tenant & Security Boundaries ──
    organization_id: str
    user_id: str
    user_role: str
    department_id: Optional[str]
    scope: str  # "DEPARTMENT" | "UNIVERSITY"

    # ── User Input & Classification ──
    request: str
    intent: Optional[str]

    # ── Enterprise Intelligence Context ──
    retrieved_context: List[Dict[str, Any]]  # From Hybrid RAG (Qdrant + BM25 + Neo4j)
    database_context: List[Dict[str, Any]]   # From UniversityDataSource
    tool_outputs: List[Dict[str, Any]]       # From ETR execution

    # ── Outputs & Audit ──
    artifacts: List[Dict[str, Any]]
    verification: Optional[Dict[str, Any]]
    provenance: List[str]
    execution_trace: List[str]  # e.g., ["✓ Intent classified", "✓ Scope verified"]
    error: Optional[str]
