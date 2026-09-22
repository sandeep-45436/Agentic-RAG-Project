from typing import Optional, Dict, Any, List
from agents.base.state import BaseAgentState

class PlacementState(BaseAgentState):
    """Specialized state for Placement Orchestrator Graph."""
    intent: Optional[str] # JD_ANALYSIS | CANDIDATE_SEARCH | RESUME_ANALYSIS | INTERVIEW_PREP | PLACEMENT_ANALYTICS
    raw_job_description: Optional[str]
    parsed_criteria: Optional[Dict[str, Any]]
    candidate_pool: List[Dict[str, Any]]
    eligibility_result: Optional[Dict[str, Any]]
    ranked_candidates: List[Dict[str, Any]]
    verification_result: Optional[Dict[str, Any]]
    interview_viva: Optional[Dict[str, Any]]
    placement_summary: Optional[str]
    provenance_metadata: Optional[Dict[str, Any]]
