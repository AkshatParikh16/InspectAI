from datetime import UTC, datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class SystemType(str, Enum):
    RAG = "RAG"
    CUSTOMER_SUPPORT = "CUSTOMER_SUPPORT"
    MULTI_AGENT = "MULTI_AGENT"


class FailureType(str, Enum):
    HALLUCINATION = "HALLUCINATION"
    POLICY_VIOLATION = "POLICY_VIOLATION"
    INCOMPLETE = "INCOMPLETE"
    WRONG_ANSWER = "WRONG_ANSWER"
    CONTEXT_LOSS = "CONTEXT_LOSS"
    ESCALATION_FAILURE = "ESCALATION_FAILURE"


class DifficultyLevel(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"
    ADVERSARIAL = "ADVERSARIAL"


class Priority(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class Scenario(BaseModel):
    id: UUID = Field(default_factory=uuid4, description="Unique identifier for the scenario")
    system_type: SystemType = Field(..., description="Type of AI system being tested")
    input: str = Field(..., description="The input to be sent to the AI system")
    expected_behavior: str = Field(..., description="Description of expected behavior")
    difficulty: DifficultyLevel = Field(..., description="Difficulty level of the scenario")
    tags: list[str] = Field(default_factory=list, description="Tags for categorization")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), description="Creation timestamp"
    )


class TestResult(BaseModel):
    id: UUID = Field(default_factory=uuid4, description="Unique identifier for the test result")
    scenario_id: UUID = Field(..., description="ID of the scenario that was tested")
    system_type: SystemType = Field(..., description="Type of AI system tested")
    passed: bool = Field(..., description="Whether the test passed")
    failure_type: Optional[FailureType] = Field(None, description="Type of failure if test failed")
    confidence_score: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence score between 0 and 1"
    )
    actual_response: str = Field(..., description="Actual response from the AI system")
    fix_recommendation: Optional[str] = Field(None, description="Recommended fix if test failed")
    latency_ms: float = Field(..., description="Response latency in milliseconds")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), description="Creation timestamp"
    )


class TestRun(BaseModel):
    id: UUID = Field(default_factory=uuid4, description="Unique identifier for the test run")
    system_type: SystemType = Field(..., description="Type of AI system tested")
    total_scenarios: int = Field(..., description="Total number of scenarios run")
    passed: int = Field(..., description="Number of scenarios that passed")
    failed: int = Field(..., description="Number of scenarios that failed")
    failure_breakdown: dict = Field(
        default_factory=dict, description="Breakdown of failures by type"
    )
    pass_rate: float = Field(..., description="Overall pass rate as a fraction between 0 and 1")
    started_at: datetime = Field(..., description="When the test run started")
    completed_at: Optional[datetime] = Field(None, description="When the test run completed")


class FixRecommendation(BaseModel):
    failure_type: FailureType = Field(
        ..., description="Type of failure this recommendation addresses"
    )
    recommendation: str = Field(..., description="The fix recommendation")
    priority: Priority = Field(..., description="Priority level of the fix")
    example_fix: Optional[str] = Field(None, description="Example of how to implement the fix")
