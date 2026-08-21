from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field
from typing_extensions import TypedDict


class SubTask(BaseModel):
    id: str
    type: Literal["KNOWLEDGE_LOOKUP", "DATABASE_QUERY", "WORKFLOW_EXECUTION"]
    query: str
    status: Literal["pending", "in_progress", "completed", "failed"] = "pending"


class CognitivePlan(BaseModel):
    goal: str
    complexity: Optional[Literal["low", "medium", "high"]] = "medium"
    agents: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    subTasks: List[SubTask] = Field(default_factory=list)
    currentStepIndex: int = 0
    isComplete: bool = False


class VerificationResult(BaseModel):
    isGrounded: bool
    confidenceScore: float
    hallucinationFlag: bool


class CognitiveStateDict(TypedDict, total=False):
    messages: List[Dict[str, Any]]
    organizationId: str
    userId: str
    userRole: str
    plan: Optional[Dict[str, Any]]
    queryAnalysis: Optional[Dict[str, Any]]
    routedPath: str
    knowledgeContext: Dict[str, Any]
    databaseContext: List[Dict[str, Any]]
    toolOutputs: List[Dict[str, Any]]
    verification: Optional[Dict[str, Any]]
    memory: Dict[str, Any]
    formattedCitations: str
    finalPrompt: str
