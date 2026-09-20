from typing import Optional, Dict, Any, List
from agents.base.state import BaseAgentState

class HODState(BaseAgentState):
    """Specialized state for HOD Governance Graph."""
    department_name: Optional[str]
    raw_grades_data: Optional[Dict[str, Any]]
    copo_result: Optional[Dict[str, Any]]
    faculty_roster: List[Dict[str, Any]]
    workload_result: Optional[Dict[str, Any]]
    pacing_alerts: List[Dict[str, Any]]
    executive_narrative: Optional[str]
