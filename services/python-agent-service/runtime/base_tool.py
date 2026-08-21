import time
import abc
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class ToolMetadata(BaseModel):
    tool_id: str = Field(..., description="Unique tool identifier")
    version: str = Field("1.0.0", description="Semantic version string")
    name: str = Field(..., description="Human-readable tool name")
    description: str = Field(..., description="Detailed description of tool capability")
    category: str = Field("general", description="Category: knowledge, database, workflow, analytics, admin")
    owner: str = Field("system", description="Team/Service owner of the tool")
    input_schema: Dict[str, Any] = Field(default_factory=dict, description="JSON schema for input validation")
    output_schema: Dict[str, Any] = Field(default_factory=dict, description="JSON schema for output validation")
    required_permissions: List[str] = Field(default_factory=list, description="Roles/Permissions required to invoke tool")
    timeout_seconds: int = Field(30, description="Max execution timeout in seconds")
    retry_count: int = Field(3, description="Max retry attempts for transient errors")
    cacheable: bool = Field(False, description="Whether tool result can be cached")
    audit_enabled: bool = Field(True, description="Whether invocation generates audit logs")
    metrics_enabled: bool = Field(True, description="Whether telemetry metrics are recorded")
    status: str = Field("ACTIVE", description="Tool status: ACTIVE, DEPRECATED, MAINTENANCE")


class ToolResult(BaseModel):
    success: bool = True
    status: str = Field("SUCCESS", description="SUCCESS, FAILURE, PARTIAL_SUCCESS")
    data: Any = None
    execution_time_ms: float = 0.0
    tool_version: str = "1.0.0"
    confidence: float = 1.0
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    trace_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AbstractBaseTool(abc.ABC):
    def __init__(self, metadata: ToolMetadata):
        self.metadata = metadata

    @abc.abstractmethod
    def initialize(self) -> None:
        """Initialize connections or dependencies."""
        pass

    def validate_input(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Validate input payload before execution."""
        return payload

    @abc.abstractmethod
    def execute(self, payload: Dict[str, Any], context: Any) -> Dict[str, Any]:
        """Core tool logic execution."""
        pass

    def validate_output(self, output: Dict[str, Any]) -> Dict[str, Any]:
        """Validate output format after execution."""
        return output

    def cleanup(self) -> None:
        """Cleanup transient resources if any."""
        pass
