from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class SystemType(StrEnum):
    RAG = "RAG"
    CUSTOMER_SUPPORT = "CUSTOMER_SUPPORT"
    MULTI_AGENT = "MULTI_AGENT"


class FailureType(StrEnum):
    HALLUCINATION = "HALLUCINATION"
    POLICY_VIOLATION = "POLICY_VIOLATION"
    INCOMPLETE = "INCOMPLETE"
    WRONG_ANSWER = "WRONG_ANSWER"
    CONTEXT_LOSS = "CONTEXT_LOSS"
    ESCALATION_FAILURE = "ESCALATION_FAILURE"


class DifficultyLevel(StrEnum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"
    ADVERSARIAL = "ADVERSARIAL"


class Priority(StrEnum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ScenarioGenerationStrategy(StrEnum):
    FROM_SCRATCH = "FROM_SCRATCH"
    FROM_FAILURES = "FROM_FAILURES"
    ADVERSARIAL_FROM_CORRECT = "ADVERSARIAL_FROM_CORRECT"
    SMART_MIX = "SMART_MIX"


# ─── Fix 1: Example conversation ──────────────────────────────────

class ExampleConversation(BaseModel):
    role: str                           # "user" or "assistant"
    content: str
    outcome: str | None = None       # what happened, was it good or bad
    tags: list[str] = []


# ─── Shared base config ───────────────────────────────────────────

class ToneConfig(BaseModel):
    """Controls how the AI system should communicate."""
    formality: str = "professional"     # professional, formal, technical
    language: str = "en"                # ISO 639-1 language code
    empathy_required: bool = True       # must show empathy on complaints
    profanity_filter: bool = True       # block inappropriate language

class ComplianceConfig(BaseModel):
    """Regulatory and legal requirements per market."""
    gdpr_enabled: bool = False          # EU markets
    hipaa_enabled: bool = False         # US healthcare
    pci_dss_enabled: bool = False       # payment processing
    data_residency: str | None = None  # "EU", "US", "APAC"
    pii_redaction: bool = False         # redact personal info in logs
    audit_trail_required: bool = False  # log every decision

# ─── Customer Support specific config ────────────────────────────

class EscalationConfig(BaseModel):
    """When and how to escalate to a human agent."""
    refund_threshold: float | None = None   # escalate above this amount
    sentiment_threshold: float = 0.3           # escalate if anger score above this
    max_turns_before_escalate: int = 5         # escalate after N failed turns
    escalate_on_keywords: list[str] = []       # e.g. ["lawyer", "lawsuit", "fraud"]
    operating_hours: str | None = None      # e.g. "9am-5pm EST Mon-Fri"
    after_hours_behavior: str = "ticket"       # ticket, email, or voicemail

class CustomerSupportConfig(BaseModel):
    """Full configuration for a customer support AI system."""
    company_name: str
    industry: str                              # retail, fintech, healthcare, saas
    escalation: EscalationConfig = EscalationConfig()
    tone: ToneConfig = ToneConfig()
    compliance: ComplianceConfig = ComplianceConfig()
    allowed_actions: list[str] = []            # e.g. ["refund", "cancel", "reschedule"]
    prohibited_actions: list[str] = []        # e.g. ["delete_account", "waive_fee"]
    knowledge_base_topics: list[str] = []     # what the AI knows about
    max_refund_amount: float | None = None # auto-process below this, escalate above
    return_window_days: int | None = None  # e.g. 30 days return policy
    example_conversations: list[ExampleConversation] = []

# ─── RAG system specific config ───────────────────────────────────

class RetrievalConfig(BaseModel):
    """How the RAG system retrieves information."""
    retrieval_strategy: str = "hybrid"        # dense, sparse, hybrid, graph
    top_k: int = 5                            # number of chunks to retrieve
    confidence_threshold: float = 0.7         # minimum score to use a chunk
    reranking_enabled: bool = False           # use a reranker model
    max_context_length: int = 4000            # max tokens in context window

class RAGConfig(BaseModel):
    """Full configuration for a RAG AI system."""
    company_name: str
    domain: str                               # legal, medical, finance, general
    retrieval: RetrievalConfig = RetrievalConfig()
    compliance: ComplianceConfig = ComplianceConfig()
    hallucination_tolerance: float = 0.0      # 0.0 = zero tolerance
    citation_required: bool = True            # must cite sources
    out_of_scope_behavior: str = "refuse"     # refuse or escalate
    document_access_control: bool = False     # RBAC on documents
    supported_languages: list[str] = ["en"]   # ISO language codes
    example_queries: list[ExampleConversation] = []

# ─── Multi-agent system specific config ───────────────────────────

class AgentBudgetConfig(BaseModel):
    """Cost and resource limits per agent run."""
    max_cost_per_run: float | None = None  # in USD
    max_tokens_per_run: int | None = None
    max_steps: int = 20                       # prevent infinite loops
    timeout_seconds: int = 300               # 5 minute default

class MultiAgentConfig(BaseModel):
    """Full configuration for a multi-agent AI system."""
    company_name: str
    use_case: str                             # coding, research, support, ops
    budget: AgentBudgetConfig = AgentBudgetConfig()
    compliance: ComplianceConfig = ComplianceConfig()
    human_in_loop_required: bool = False      # require human approval mid-task
    human_in_loop_triggers: list[str] = []   # e.g. ["delete", "payment", "deploy"]
    allowed_tools: list[str] = []            # tools the agents can use
    prohibited_tools: list[str] = []        # tools that are blocked
    parallel_agents_allowed: bool = True     # can agents run simultaneously
    audit_every_step: bool = False           # log every agent decision
    example_tasks: list[ExampleConversation] = []

# ─── Master config that wraps everything ──────────────────────────

class SystemConfig(BaseModel):
    """
    Master configuration for any AI system being tested by InspectAI.
    Pass this to the ScenarioGenerator to get policy-aware test scenarios.
    """
    system_type: SystemType
    customer_support: CustomerSupportConfig | None = None
    rag: RAGConfig | None = None
    multi_agent: MultiAgentConfig | None = None
    example_conversations: list[dict] = []  # Real conversation examples to seed scenario generation
    example_count: int = 0                  # How many examples were provided
    generation_strategy: ScenarioGenerationStrategy = ScenarioGenerationStrategy.SMART_MIX

    def get_active_config(self):
        """Returns the config relevant to the system type."""
        if self.system_type == SystemType.CUSTOMER_SUPPORT:
            return self.customer_support
        elif self.system_type == SystemType.RAG:
            return self.rag
        elif self.system_type == SystemType.MULTI_AGENT:
            return self.multi_agent
        return None


# ─── Fix 2: Judge calibration ─────────────────────────────────────

class JudgeCalibration(BaseModel):
    judge_name: str
    task_type: str              # summarization, rag_groundedness, agent_success, policy_compliance
    general_kappa: float
    domain_kappa: float | None = None
    domain_label_count: int | None = None
    general_label_count: int = 0
    true_positive_rate: float
    true_negative_rate: float
    last_calibrated: datetime
    notes: str | None = None


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
    failure_type: FailureType | None = Field(None, description="Type of failure if test failed")
    confidence_score: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence score between 0 and 1"
    )
    actual_response: str = Field(..., description="Actual response from the AI system")
    fix_recommendation: str | None = Field(None, description="Recommended fix if test failed")
    latency_ms: float = Field(..., description="Response latency in milliseconds")
    judge_calibration: JudgeCalibration | None = None
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), description="Creation timestamp"
    )


# ─── Fix 4: Cost estimation ────────────────────────────────────────

class CostEstimate(BaseModel):
    estimated_tokens: int
    estimated_cost_usd: float
    model_used: str
    scenario_count: int
    breakdown: dict             # generation, testing, analysis, fix costs


# ─── Fix 3: TestRunConfig and dry run fields ───────────────────────

class TestRunConfig(BaseModel):
    dry_run: bool = False
    max_scenarios: int = 200
    budget_limit_usd: float | None = None
    target_url: str
    is_production_target: bool = False
    staging_warning_acknowledged: bool = False
    timeout_seconds: int = 30
    generation_strategy: ScenarioGenerationStrategy = ScenarioGenerationStrategy.SMART_MIX
    failure_weight: float = 0.35
    adversarial_weight: float = 0.15
    new_edge_case_weight: float = 0.50
    regression_weight: float = 0.20


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
    completed_at: datetime | None = Field(None, description="When the test run completed")
    dry_run: bool = False
    is_production_target: bool = False
    staging_warning_acknowledged: bool = False
    estimated_cost: CostEstimate | None = None
    actual_cost_usd: float | None = None
    total_tokens_used: int | None = None


# ─── Fix 5: Trend tracking ────────────────────────────────────────

class TestRunTrend(BaseModel):
    system_config_hash: str          # identifies same system over time
    run_history: list[dict]          # list of run_id, pass_rate, date
    improvement_rate: float          # % improvement from first to latest run
    best_pass_rate: float
    worst_pass_rate: float
    total_runs: int
    fixes_applied: list[str]         # which fixes were applied between runs
    regression_pass_rate: float | None = None
    regression_scenarios_count: int = 0
    corrections_applied: int = 0


# ─── Fix 3 (extended): Learning and effectiveness tracking ────────

class ScenarioEffectiveness(BaseModel):
    scenario_pattern: str
    failure_rate: float
    times_used: int
    system_type: SystemType
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class FixEffectiveness(BaseModel):
    failure_type: FailureType
    fix_pattern: str
    success_rate: float
    times_applied: int
    average_improvement: float
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class JudgeCorrection(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    result_id: UUID
    original_verdict: bool
    correct_verdict: bool
    failure_type: FailureType | None = None
    corrected_by: str = "human"
    corrected_at: datetime = Field(default_factory=datetime.utcnow)
    notes: str | None = None

class InspectAILearning(BaseModel):
    scenario_effectiveness: list[ScenarioEffectiveness] = []
    fix_effectiveness: list[FixEffectiveness] = []
    judge_corrections: list[JudgeCorrection] = []
    total_corrections: int = 0
    last_learning_update: datetime | None = None


class FixRecommendation(BaseModel):
    failure_type: FailureType = Field(
        ..., description="Type of failure this recommendation addresses"
    )
    recommendation: str = Field(..., description="The fix recommendation")
    priority: Priority = Field(..., description="Priority level of the fix")
    example_fix: str | None = Field(None, description="Example of how to implement the fix")
