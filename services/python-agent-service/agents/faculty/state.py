from typing import Optional, Dict, Any, List
from agents.base.state import BaseAgentState

class FacultyState(BaseAgentState):
    """Specialized state for Faculty Copilot Graph."""
    course_id: Optional[str]
    course_title: Optional[str]
    syllabus_topics: List[str]
    bloom_distribution: Optional[Dict[str, Any]]
    quiz_artifact: Optional[Dict[str, Any]]
    student_cohort: List[Dict[str, Any]]
    risk_evaluation: Optional[Dict[str, Any]]
    remedial_plan: Optional[Dict[str, Any]]
