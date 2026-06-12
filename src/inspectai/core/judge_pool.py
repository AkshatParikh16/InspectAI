"""
Judge pool for InspectAI evaluation panel.

Architecture:
- Judge 1 is always Prometheus 2 (free, specialized eval model, no family bias)
- Judges 2 and 3 are randomly selected from the active pool
  - Must be different family from target model
  - Must be same capability tier or higher
  - Must not duplicate each other or Judge 1
- Three judges, majority vote
  - 3/3 agree → confidence 0.95
  - 2/3 agree → confidence 0.75
  - 1/3 agree → human review flag, confidence 0.33

Active judges:
  - prometheus-eval/prometheus-bgb-8x7b-v2.0  (free, always Judge 1)
  - claude-sonnet-4-6                          (Anthropic credits)
  - gpt-5                                      (OpenAI credits)

All other judges are commented out in JUDGE_POOL — uncomment when
credentials become available.
"""

from __future__ import annotations

import random
from collections import Counter

import structlog

from inspectai.models.schemas import JudgeConfig, ModelCapabilityTier, ModelFamily

logger = structlog.get_logger()

# ─── Judge definitions ────────────────────────────────────────────
#
# ACTIVE JUDGES (credentials available):
#   - prometheus-eval  → free, self-hosted specialized eval model
#   - claude-sonnet-4-6 → Anthropic credits (Claude 4.6)
#   - gpt-5            → OpenAI credits (GPT-5)
#
# All other entries are commented out — add back when credits/access
# are available.

JUDGE_POOL: list[dict] = [
    # ── Specialized eval judges (no family bias) ──────────────────
    {
        "model": "prometheus-eval/prometheus-bgb-8x7b-v2.0",
        "family": ModelFamily.SPECIALIZED,
        "tier": ModelCapabilityTier.STANDARD,
        "description": "Open-source judge trained specifically for evaluation — free",
        "local": True,
    },
    # {  # No credits — disabled
    #     "model": "galileo-luna-2",
    #     "family": ModelFamily.SPECIALIZED,
    #     "tier": ModelCapabilityTier.FRONTIER,
    #     "description": "Eval-specific frontier judge, beats general models on rubric scoring",
    #     "local": False,
    # },

    # ── Frontier tier ─────────────────────────────────────────────
    # {  # No credits — disabled
    #     "model": "claude-opus-4-20250514",
    #     "family": ModelFamily.ANTHROPIC,
    #     "tier": ModelCapabilityTier.FRONTIER,
    #     "description": "Anthropic frontier model",
    #     "local": False,
    # },
    {
        "model": "gpt-5",
        "family": ModelFamily.OPENAI,
        "tier": ModelCapabilityTier.FRONTIER,
        "description": "OpenAI GPT-5 — active credits",
        "local": False,
    },
    # {  # No credits — disabled
    #     "model": "gemini-2.5-pro",
    #     "family": ModelFamily.GOOGLE,
    #     "tier": ModelCapabilityTier.FRONTIER,
    #     "description": "Google frontier model",
    #     "local": False,
    # },
    # {  # No credits — disabled
    #     "model": "grok-3",
    #     "family": ModelFamily.XAI,
    #     "tier": ModelCapabilityTier.FRONTIER,
    #     "description": "xAI frontier model",
    #     "local": False,
    # },
    # {  # No credits — disabled
    #     "model": "deepseek-r2",
    #     "family": ModelFamily.DEEPSEEK,
    #     "tier": ModelCapabilityTier.FRONTIER,
    #     "description": "DeepSeek frontier model",
    #     "local": False,
    # },

    # ── Standard tier ─────────────────────────────────────────────
    {
        "model": "claude-sonnet-4-6",
        "family": ModelFamily.ANTHROPIC,
        "tier": ModelCapabilityTier.STANDARD,
        "description": "Anthropic Claude 4.6 — active credits",
        "local": False,
    },
    # {  # No credits — disabled
    #     "model": "gpt-4o-mini",
    #     "family": ModelFamily.OPENAI,
    #     "tier": ModelCapabilityTier.STANDARD,
    #     "description": "OpenAI standard model",
    #     "local": False,
    # },
    # {  # No credits — disabled
    #     "model": "gemini-2.5-flash",
    #     "family": ModelFamily.GOOGLE,
    #     "tier": ModelCapabilityTier.STANDARD,
    #     "description": "Google standard model",
    #     "local": False,
    # },
    # {  # No credits — disabled
    #     "model": "mistral-large-latest",
    #     "family": ModelFamily.MISTRAL,
    #     "tier": ModelCapabilityTier.STANDARD,
    #     "description": "Mistral standard model",
    #     "local": False,
    # },
    # {  # No credits — disabled
    #     "model": "llama-3.3-70b-instruct",
    #     "family": ModelFamily.META,
    #     "tier": ModelCapabilityTier.STANDARD,
    #     "description": "Meta standard model — self-hostable",
    #     "local": True,
    # },
    # {  # No credits — disabled
    #     "model": "deepseek-v3",
    #     "family": ModelFamily.DEEPSEEK,
    #     "tier": ModelCapabilityTier.STANDARD,
    #     "description": "DeepSeek standard model",
    #     "local": False,
    # },
    # {  # No credits — disabled
    #     "model": "qwen2.5-72b-instruct",
    #     "family": ModelFamily.ALIBABA,
    #     "tier": ModelCapabilityTier.STANDARD,
    #     "description": "Alibaba standard model",
    #     "local": False,
    # },
]

# ─── Tier hierarchy ───────────────────────────────────────────────
# Lower number = higher capability
TIER_ORDER = {
    ModelCapabilityTier.FRONTIER: 1,
    ModelCapabilityTier.STANDARD: 2,
    ModelCapabilityTier.LIGHT: 3,
}


def _is_eligible(
    judge: dict,
    target_family: ModelFamily,
    target_tier: ModelCapabilityTier,
    excluded_models: list[str],
) -> bool:
    """
    Returns True if a judge is eligible for selection.

    Rules:
    1. Not from same family as target (SPECIALIZED always eligible)
    2. Same capability tier or higher (lower tier number = higher cap)
    3. Not already selected (excluded_models)
    """
    if judge["model"] in excluded_models:
        return False

    # Specialized judges always eligible regardless of target family
    if judge["family"] != ModelFamily.SPECIALIZED:
        if judge["family"] == target_family:
            return False

    # Must be same tier or higher capability
    judge_tier_order = TIER_ORDER.get(judge["tier"], 99)
    target_tier_order = TIER_ORDER.get(target_tier, 2)
    if judge_tier_order > target_tier_order:
        return False

    return True


def get_judge_1(target_tier: ModelCapabilityTier) -> dict:
    """
    Returns the fixed specialized judge for Judge 1 slot.

    Always uses Prometheus 2 (free, specialized eval model).
    Galileo Luna-2 (frontier specialized) is disabled — no credits.
    Re-enable by uncommenting galileo-luna-2 in JUDGE_POOL and
    restoring the frontier branch below.
    """
    judge = next(
        j for j in JUDGE_POOL
        if j["model"] == "prometheus-eval/prometheus-bgb-8x7b-v2.0"
    )
    logger.info(
        "judge_1_selected",
        model=judge["model"],
        target_tier=target_tier,
    )
    return judge


def select_judges(judge_config: JudgeConfig) -> list[dict]:
    """
    Selects the full three-judge panel.

    Judge 1: Fixed specialized judge based on target tier
    Judge 2: Random from eligible pool
    Judge 3: Random from eligible pool, different from Judge 2

    Returns list of judge dicts with model, family, tier info.
    """
    target_family = judge_config.target_model_family
    target_tier = judge_config.target_capability_tier

    # Judge 1 — fixed specialized judge
    judge_1 = get_judge_1(target_tier)
    selected = [judge_1]
    excluded = [judge_1["model"]]

    # Judges 2 and 3 — random from eligible pool
    for slot in [2, 3]:
        eligible = [
            j for j in JUDGE_POOL
            if _is_eligible(j, target_family, target_tier, excluded)
        ]

        if not eligible:
            # Fallback — relax tier constraint if no eligible judges
            eligible = [
                j for j in JUDGE_POOL
                if j["model"] not in excluded
                and (
                    j["family"] != target_family
                    or j["family"] == ModelFamily.SPECIALIZED
                )
            ]

        if not eligible:
            logger.warning(
                "no_eligible_judge_found",
                slot=slot,
                target_family=target_family,
                excluded=excluded,
            )
            break

        chosen = random.choice(eligible)
        selected.append(chosen)
        excluded.append(chosen["model"])

        logger.info(
            f"judge_{slot}_selected",
            model=chosen["model"],
            family=chosen["family"],
            tier=chosen["tier"],
        )

    return selected


def calculate_panel_verdict(
    verdicts: list[bool],
    failure_types: list[str | None],
    judge_models: list[str],
) -> dict:
    """
    Calculates the final panel verdict from individual judge verdicts.

    3/3 agree → confidence 0.95
    2/3 agree → confidence 0.75
    1/3 agree → human review flag, confidence 0.33

    Failure type is determined by majority among failing judges.
    """
    pass_count = sum(1 for v in verdicts if v)
    fail_count = len(verdicts) - pass_count
    total = len(verdicts)

    if total == 0:
        return {
            "passed": True,
            "confidence": 0.0,
            "agreement_level": "no_judges",
            "requires_human_review": True,
            "human_review_reason": "No judges returned verdicts",
            "failure_type": None,
        }

    # Determine majority verdict
    if pass_count > fail_count:
        final_passed = True
    elif fail_count > pass_count:
        final_passed = False
    else:
        # Tie — flag for human review
        return {
            "passed": False,
            "confidence": 0.33,
            "agreement_level": "tie",
            "requires_human_review": True,
            "human_review_reason": "Judges tied — equal pass and fail votes",
            "failure_type": None,
        }

    # Calculate confidence based on agreement
    majority_count = max(pass_count, fail_count)
    if majority_count == total:
        confidence = 0.95
        agreement_level = "unanimous"
        requires_review = False
        review_reason = ""
    elif majority_count == total - 1:
        confidence = 0.75
        agreement_level = "majority"
        requires_review = False
        review_reason = ""
    else:
        confidence = 0.33
        agreement_level = "minority"
        requires_review = True
        review_reason = "Only minority agreement among judges"

    # Determine failure type from failing judges
    failure_type = None
    if not final_passed:
        failing_types = [
            ft for v, ft in zip(verdicts, failure_types)
            if not v and ft is not None
        ]
        if failing_types:
            failure_type = Counter(failing_types).most_common(1)[0][0]

    logger.info(
        "panel_verdict_calculated",
        passed=final_passed,
        confidence=confidence,
        agreement_level=agreement_level,
        pass_votes=pass_count,
        fail_votes=fail_count,
        requires_review=requires_review,
    )

    return {
        "passed": final_passed,
        "confidence": confidence,
        "agreement_level": agreement_level,
        "requires_human_review": requires_review,
        "human_review_reason": review_reason,
        "failure_type": failure_type,
    }
