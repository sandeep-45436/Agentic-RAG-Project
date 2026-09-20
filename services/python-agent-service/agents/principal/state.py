from typing import Optional, Dict, Any, List
from agents.base.state import BaseAgentState

class PrincipalState(BaseAgentState):
    """Specialized state for Principal Executive Graph."""
    institutional_scope_verified: bool
    benchmark_metrics: Optional[Dict[str, Any]]
    policy_documents: List[Dict[str, Any]]
    circular_draft: Optional[Dict[str, Any]]
    board_briefing: Optional[str]
