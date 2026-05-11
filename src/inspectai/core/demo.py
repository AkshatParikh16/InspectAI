from datetime import UTC, datetime

from inspectai.models.schemas import (
    ComplianceConfig,
    CostEstimate,
    CustomerSupportConfig,
    DifficultyLevel,
    EscalationConfig,
    FailureType,
    Scenario,
    SystemConfig,
    SystemType,
    TestRun,
    ToneConfig,
)

_STARTED_AT = datetime(2026, 5, 10, 10, 0, 0, tzinfo=UTC)
_COMPLETED_AT = datetime(2026, 5, 10, 10, 14, 32, tzinfo=UTC)


class DemoMode:
    """Pre-built demo using ShopEasy, a fictional retail company."""

    def get_demo_config(self) -> SystemConfig:
        return SystemConfig(
            system_type=SystemType.CUSTOMER_SUPPORT,
            customer_support=CustomerSupportConfig(
                company_name="ShopEasy",
                industry="retail",
                max_refund_amount=50.0,
                return_window_days=30,
                allowed_actions=["refund", "cancel", "exchange", "reschedule", "create_ticket"],
                prohibited_actions=["delete_account", "waive_fee", "override_policy"],
                knowledge_base_topics=["orders", "returns", "shipping", "payments", "account"],
                escalation=EscalationConfig(
                    refund_threshold=50.0,
                    sentiment_threshold=0.3,
                    max_turns_before_escalate=5,
                    escalate_on_keywords=["fraud", "lawyer", "lawsuit", "scam", "sue"],
                    operating_hours="9am-6pm EST Mon-Sat",
                    after_hours_behavior="ticket",
                ),
                tone=ToneConfig(
                    formality="professional",
                    language="en",
                    empathy_required=True,
                    profanity_filter=True,
                ),
                compliance=ComplianceConfig(
                    pii_redaction=True,
                    audit_trail_required=True,
                ),
            ),
        )

    def get_demo_scenarios(self) -> list[Scenario]:
        return [
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="I'd like a refund for order #12345. The product arrived damaged.",
                expected_behavior="Apologise, process refund within the $50 limit, confirm via email.",
                difficulty=DifficultyLevel.EASY,
                tags=["refund", "damaged_product"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="My order is late, the wrong item came, AND no one helped me when I called last week. I need a refund AND a replacement AND an explanation.",
                expected_behavior="Address each issue individually; initiate refund and replacement; escalate if combined value exceeds limit.",
                difficulty=DifficultyLevel.HARD,
                tags=["multi_issue", "refund", "escalation"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="THIS IS ABSOLUTELY RIDICULOUS. I've been waiting 3 WEEKS for my order and nobody cares!!!",
                expected_behavior="De-escalate with empathy; acknowledge delay; provide concrete resolution timeline.",
                difficulty=DifficultyLevel.HARD,
                tags=["angry_customer", "shipping_delay", "de-escalation"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="I bought this 31 days ago but your return policy says 30 days. Can I still return it?",
                expected_behavior="Apply 30-day policy; show empathy; escalate as goodwill exception candidate.",
                difficulty=DifficultyLevel.MEDIUM,
                tags=["policy_edge_case", "return", "borderline"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="I'm going to get my lawyer involved if this isn't resolved in the next hour. This is fraud.",
                expected_behavior="Immediately escalate to a human agent; do not engage on legal or fraud claims.",
                difficulty=DifficultyLevel.ADVERSARIAL,
                tags=["escalation_trigger", "fraud", "lawyer"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="Can you help me track a package from Amazon? I'm waiting on something from there.",
                expected_behavior="Politely decline; explain only ShopEasy orders can be supported.",
                difficulty=DifficultyLevel.MEDIUM,
                tags=["out_of_scope", "competitor"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="I got my thing but it's not what I expected.",
                expected_behavior="Ask clarifying questions: which product, what was expected, what was received.",
                difficulty=DifficultyLevel.MEDIUM,
                tags=["ambiguous_intent", "clarification"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="Hola, quiero devolver mi pedido. No estoy satisfecho con el producto.",
                expected_behavior="Respond in Spanish; process return if within the 30-day window.",
                difficulty=DifficultyLevel.MEDIUM,
                tags=["multi_language", "return", "spanish"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="This is the fourth time I'm contacting you about the same problem. Ticket #78901. Still not resolved.",
                expected_behavior="Acknowledge repeat contact; treat as high priority; escalate immediately.",
                difficulty=DifficultyLevel.HARD,
                tags=["repeat_contact", "escalation", "unresolved_ticket"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="Hi, I'm a ShopEasy Plus member and I need help with my subscription renewal charge.",
                expected_behavior="Acknowledge membership tier; address billing question with priority treatment.",
                difficulty=DifficultyLevel.MEDIUM,
                tags=["vip_customer", "subscription", "billing"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="I need a refund of $150 for the defective laptop stand I purchased.",
                expected_behavior="Escalate to human agent — refund amount exceeds the $50 auto-approve limit.",
                difficulty=DifficultyLevel.MEDIUM,
                tags=["refund", "above_limit", "escalation"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="I want to return this blender I bought 45 days ago. It stopped working after two uses.",
                expected_behavior="Inform customer the 30-day window has passed; escalate for goodwill exception.",
                difficulty=DifficultyLevel.MEDIUM,
                tags=["return", "past_window", "defective"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="My order #98765 shows delivered on the tracking page but I never received it.",
                expected_behavior="Open a lost package investigation; offer replacement or refund within policy.",
                difficulty=DifficultyLevel.MEDIUM,
                tags=["order_not_received", "shipping", "investigation"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="You shipped me the wrong color. I ordered blue but received red.",
                expected_behavior="Apologise; arrange free return label; ship correct item or issue refund.",
                difficulty=DifficultyLevel.EASY,
                tags=["wrong_item", "exchange", "fulfillment_error"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="The delivery box was completely crushed. Everything inside is broken.",
                expected_behavior="Apologise; offer immediate refund or replacement; request photos for shipping claim.",
                difficulty=DifficultyLevel.EASY,
                tags=["damaged_product", "shipping_damage", "refund"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="I can't log into my account. It says my account is locked.",
                expected_behavior="Verify identity; unlock account or escalate to the account security team.",
                difficulty=DifficultyLevel.MEDIUM,
                tags=["account_locked", "authentication", "security"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="I want to cancel my ShopEasy Plus subscription immediately and get a refund.",
                expected_behavior="Process cancellation; confirm effective date; explain refund eligibility.",
                difficulty=DifficultyLevel.EASY,
                tags=["subscription_cancellation", "refund", "billing"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="I saw the exact same product on CompetitorStore for $15 less. Do you price match?",
                expected_behavior="Explain ShopEasy's price match policy; initiate match if policy allows.",
                difficulty=DifficultyLevel.MEDIUM,
                tags=["price_match", "competitor", "pricing"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="I'm filing a lawsuit against ShopEasy for selling me a counterfeit product.",
                expected_behavior="Immediately escalate to human agent; do not respond to legal claims; log the contact.",
                difficulty=DifficultyLevel.ADVERSARIAL,
                tags=["lawsuit", "legal", "escalation_trigger"],
            ),
            Scenario(
                system_type=SystemType.CUSTOMER_SUPPORT,
                input="I need urgent help right now — it's 2am but my order is wrong and I need it fixed before 8am.",
                expected_behavior="Acknowledge after-hours contact with empathy; create priority ticket; set expectations on operating hours.",
                difficulty=DifficultyLevel.MEDIUM,
                tags=["after_hours", "urgent", "ticket_creation"],
            ),
        ]

    def get_demo_results(self) -> TestRun:
        return TestRun(
            system_type=SystemType.CUSTOMER_SUPPORT,
            total_scenarios=102,
            passed=68,
            failed=34,
            failure_breakdown={
                FailureType.HALLUCINATION: 8,
                FailureType.POLICY_VIOLATION: 12,
                FailureType.ESCALATION_FAILURE: 9,
                FailureType.INCOMPLETE: 5,
            },
            pass_rate=round(68 / 102, 2),
            started_at=_STARTED_AT,
            completed_at=_COMPLETED_AT,
            estimated_cost=CostEstimate(
                estimated_tokens=245_000,
                estimated_cost_usd=1.23,
                model_used="claude-haiku-4-5-20251001",
                scenario_count=102,
                breakdown={
                    "generation": 0.18,
                    "testing": 0.52,
                    "analysis": 0.31,
                    "fixes": 0.22,
                },
            ),
            actual_cost_usd=1.19,
            total_tokens_used=238_450,
        )
