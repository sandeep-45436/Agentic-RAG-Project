from typing import Optional, Dict, Any, List
from agents.base.state import BaseAgentState

class PlacementState(BaseAgentState):
    """Specialized state for Placement Orchestrator Graph."""
    raw_job_description: str
    parsed_criteria: Optional[Dict[str, Any]]
    candidate_pool: List[Dict[str, Any]]
    eligibility_result: Optional[Dict[str, Any]]
    ranked_candidates: List[Dict[str, Any]]
    interview_viva: Optional[Dict[str, Any]]
    placement_summary: Optional[str]
