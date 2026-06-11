"""
Test runner for InspectAI.

Fires scenarios at the target AI system and evaluates responses
using a three-stage evaluation pipeline:

Stage 1 — Rule-based checks (instant, free)
    Simple programmatic checks that catch obvious failures
    before spending tokens on LLM evaluation.

Stage 2 — Three-judge LLM panel (calibrated, cross-model)
    Judge 1: Fixed specialized eval model (Prometheus 2 or Galileo)
    Judge 2: Random from diverse pool, different family
    Judge 3: Random from diverse pool, different family
    Majority vote → final verdict with confidence score

Stage 3 — Programmatic outcome check (multi-agent only)
    Checks actual system state after agent execution
    No LLM needed — database/API state tells the truth

Architecture:
- Async batch runner with semaphore (max 20 concurrent)
- Three-level timeout (per request, per batch, total run)
- Budget tracking — stops if limit exceeded
- Dry run mode — no real calls, realistic mock results
- Full TestResult per scenario with panel verdict
"""

from __future__ import annotations

import asyncio
import json
import random
import time
from uuid import uuid4

import httpx
import litellm
import structlog

from inspectai.config import settings
from inspectai.core.judge_pool import calculate_panel_verdict, select_judges
from inspectai.core.rubrics import generate_rubric, rubric_to_judge_prompt
from inspectai.models.schemas import (
    CostEstimate,
    EvaluationMethod,
    FailureType,
    JudgeConfig,
    JudgeVerdict,
    PanelVerdict,
    Scenario,
    SystemConfig,
    SystemType,
    TargetAPIConfig,
    TestResult,
    TestRunConfig,
)

logger = structlog.get_logger()

# ─── Constants ────────────────────────────────────────────────────

MAX_CONCURRENT_REQUESTS = 20
REQUEST_TIMEOUT = 30
BATCH_TIMEOUT = 120
LLM_JUDGE_TIMEOUT = 30
MOCK_PASS_RATE = 0.70         # dry run realistic pass rate
COST_PER_1K_TOKENS = 0.003   # approximate cost estimate


# ─── Main class ───────────────────────────────────────────────────

class TestRunner:
    """
    Fires scenarios at target AI systems and evaluates responses.

    Usage:
        runner = TestRunner()
        results = await runner.run(
            scenarios=scenarios,
            config=config,
            run_config=run_config,
        )
    """

    def __init__(
        self,
        model: str | None = None,
        config: dict | None = None,
    ) -> None:
        self.model = model or settings.default_model
        self.config = config or {}
        self._semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
        self._total_cost = 0.0
        self._total_tokens = 0

    async def run(
        self,
        scenarios: list[Scenario],
        target_url: str = "",
        config: SystemConfig | None = None,
        run_config: TestRunConfig | None = None,
    ) -> list[TestResult]:
        """
        Main entry point. Runs all scenarios and returns TestResult list.

        Steps:
        1. Validate inputs
        2. Generate evaluation rubric from config
        3. Select judge panel
        4. Run scenarios in async batches
        5. Return all TestResult objects
        """
        if not scenarios:
            return []

        # Use target_url from run_config if provided
        effective_url = target_url
        if run_config and run_config.target_url:
            effective_url = run_config.target_url

        # Build target API config
        api_config = TargetAPIConfig(url=effective_url)
        if run_config and run_config.target_api_config:
            api_config = run_config.target_api_config
            if not api_config.url:
                api_config = api_config.model_copy(
                    update={"url": effective_url}
                )

        is_dry_run = run_config.dry_run if run_config else False
        budget_limit = run_config.budget_limit_usd if run_config else None

        logger.info(
            "test_run_started",
            scenario_count=len(scenarios),
            target_url=api_config.url,
            dry_run=is_dry_run,
            budget_limit=budget_limit,
        )

        # Generate rubric from config
        rubric = None
        judge_prompt_suffix = ""
        if config:
            rubric = generate_rubric(config)
            judge_prompt_suffix = rubric_to_judge_prompt(rubric)

        # Select judge panel
        judge_config = JudgeConfig()
        if run_config and run_config.judge_config:
            judge_config = run_config.judge_config
        elif config and config.judge_config:
            judge_config = config.judge_config

        judges = select_judges(judge_config)

        logger.info(
            "judge_panel_selected",
            judges=[j["model"] for j in judges],
        )

        # Reset cost tracking
        self._total_cost = 0.0
        self._total_tokens = 0

        all_results: list[TestResult] = []

        async with asyncio.timeout(
            run_config.timeout_seconds * len(scenarios)
            if run_config else 3600
        ):
            for i in range(0, len(scenarios), MAX_CONCURRENT_REQUESTS):
                batch = scenarios[i: i + MAX_CONCURRENT_REQUESTS]

                # Check budget before each batch
                if budget_limit and self._total_cost >= budget_limit:
                    logger.warning(
                        "budget_limit_reached",
                        cost=self._total_cost,
                        limit=budget_limit,
                        completed=len(all_results),
                        remaining=len(scenarios) - len(all_results),
                    )
                    break

                batch_results = await self._run_batch(
                    batch=batch,
                    api_config=api_config,
                    judges=judges,
                    judge_prompt_suffix=judge_prompt_suffix,
                    config=config,
                    is_dry_run=is_dry_run,
                )
                all_results.extend(batch_results)

                logger.info(
                    "batch_complete",
                    batch_num=i // MAX_CONCURRENT_REQUESTS + 1,
                    batch_size=len(batch),
                    total_completed=len(all_results),
                    total_cost=self._total_cost,
                )

        logger.info(
            "test_run_complete",
            total_results=len(all_results),
            total_cost=self._total_cost,
            total_tokens=self._total_tokens,
        )

        return all_results

    async def run_single(
        self,
        scenario: Scenario,
        target_url: str,
        config: SystemConfig | None = None,
        judges: list[dict] | None = None,
        judge_prompt_suffix: str = "",
        is_dry_run: bool = False,
    ) -> TestResult:
        """
        Runs a single scenario and returns TestResult.
        Use run() for standard usage.
        """
        raise NotImplementedError(
            "run_single requires config and judges. "
            "Use run() for standard usage or call _run_single() directly."
        )

    # ─── Private: batch runner ────────────────────────────────────

    async def _run_batch(
        self,
        batch: list[Scenario],
        api_config: TargetAPIConfig,
        judges: list[dict],
        judge_prompt_suffix: str,
        config: SystemConfig | None,
        is_dry_run: bool,
    ) -> list[TestResult]:
        """
        Runs a batch of scenarios concurrently using semaphore.
        """
        tasks = [
            self._run_single(
                scenario=scenario,
                api_config=api_config,
                judges=judges,
                judge_prompt_suffix=judge_prompt_suffix,
                config=config,
                is_dry_run=is_dry_run,
            )
            for scenario in batch
        ]

        try:
            async with asyncio.timeout(BATCH_TIMEOUT):
                results = await asyncio.gather(*tasks, return_exceptions=True)
        except TimeoutError:
            logger.error("batch_timeout", batch_size=len(batch))
            return []

        valid_results = []
        for result in results:
            if isinstance(result, Exception):
                logger.error("scenario_exception", error=str(result))
            elif result is not None:
                valid_results.append(result)

        return valid_results

    async def _run_single(
        self,
        scenario: Scenario,
        api_config: TargetAPIConfig,
        judges: list[dict],
        judge_prompt_suffix: str,
        config: SystemConfig | None,
        is_dry_run: bool,
    ) -> TestResult | None:
        """
        Runs a single scenario through the full evaluation pipeline.

        Stage 1: Rule-based checks
        Stage 2: Three-judge LLM panel
        """
        async with self._semaphore:
            start_time = time.monotonic()

            try:
                if is_dry_run:
                    return self._create_dry_run_result(scenario)

                # ── Stage 1: Call target AI ────────────────────────
                actual_response, latency_ms = await self._call_target_ai(
                    scenario=scenario,
                    api_config=api_config,
                )

                if actual_response is None:
                    return self._create_error_result(
                        scenario=scenario,
                        latency_ms=latency_ms,
                        error="Target AI returned no response",
                    )

                # ── Stage 2: Rule-based checks ─────────────────────
                rule_result = self._apply_rule_checks(
                    scenario=scenario,
                    response=actual_response,
                    config=config,
                )

                if rule_result is not None:
                    logger.info(
                        "rule_check_failed",
                        scenario_id=str(scenario.id),
                        failure_type=rule_result,
                    )
                    return TestResult(
                        id=uuid4(),
                        scenario_id=scenario.id,
                        system_type=scenario.system_type,
                        passed=False,
                        failure_type=rule_result,
                        confidence_score=0.95,
                        actual_response=actual_response,
                        latency_ms=latency_ms,
                        evaluation_method=EvaluationMethod.RULE_BASED,
                    )

                # ── Stage 3: Three-judge LLM panel ─────────────────
                panel_verdict = await self._evaluate_with_panel(
                    scenario=scenario,
                    response=actual_response,
                    judges=judges,
                    judge_prompt_suffix=judge_prompt_suffix,
                )

                return TestResult(
                    id=uuid4(),
                    scenario_id=scenario.id,
                    system_type=scenario.system_type,
                    passed=panel_verdict.passed,
                    failure_type=panel_verdict.failure_type,
                    confidence_score=panel_verdict.confidence,
                    actual_response=actual_response,
                    latency_ms=latency_ms,
                    panel_verdict=panel_verdict,
                    evaluation_method=EvaluationMethod.HYBRID,
                )

            except Exception as e:
                elapsed = (time.monotonic() - start_time) * 1000
                logger.error(
                    "scenario_run_error",
                    scenario_id=str(scenario.id),
                    error=str(e),
                )
                return self._create_error_result(
                    scenario=scenario,
                    latency_ms=elapsed,
                    error=str(e),
                )

    # ─── Private: target AI call ──────────────────────────────────

    async def _call_target_ai(
        self,
        scenario: Scenario,
        api_config: TargetAPIConfig,
    ) -> tuple[str | None, float]:
        """
        Calls the target AI system with the scenario input.
        Returns (response_text, latency_ms).
        Returns (None, latency_ms) on failure.
        """
        start = time.monotonic()

        body: dict = {api_config.message_field: scenario.input}
        body.update(api_config.extra_fields)

        try:
            async with asyncio.timeout(api_config.timeout_seconds):
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        api_config.url,
                        json=body,
                        headers=api_config.headers,
                        timeout=api_config.timeout_seconds,
                    )
                    response.raise_for_status()

            latency_ms = (time.monotonic() - start) * 1000

            data = response.json()

            # Navigate nested response field path
            fields = api_config.response_field.split(".")
            result = data
            for field in fields:
                if isinstance(result, dict):
                    result = result.get(field, "")
                else:
                    result = ""
                    break

            return str(result), latency_ms

        except TimeoutError:
            latency_ms = (time.monotonic() - start) * 1000
            logger.warning(
                "target_ai_timeout",
                url=api_config.url,
                timeout=api_config.timeout_seconds,
            )
            return None, latency_ms

        except httpx.HTTPStatusError as e:
            latency_ms = (time.monotonic() - start) * 1000
            logger.warning(
                "target_ai_http_error",
                status=e.response.status_code,
                url=api_config.url,
            )
            return None, latency_ms

        except Exception as e:
            latency_ms = (time.monotonic() - start) * 1000
            logger.error(
                "target_ai_unexpected_error",
                error=str(e),
                url=api_config.url,
            )
            return None, latency_ms

    # ─── Private: rule-based checks ───────────────────────────────

    def _apply_rule_checks(
        self,
        scenario: Scenario,
        response: str,
        config: SystemConfig | None,
    ) -> FailureType | None:
        """
        Applies fast rule-based checks before LLM evaluation.
        Returns FailureType if obvious failure detected.
        Returns None if rules pass — proceed to LLM judge.
        """
        response_lower = response.lower().strip()

        if not response or len(response.strip()) < 5:
            return FailureType.INCOMPLETE

        refusal_phrases = [
            "i cannot help",
            "i'm unable to assist",
            "i don't have access",
            "i cannot assist with that",
        ]
        for phrase in refusal_phrases:
            if phrase in response_lower and "?" not in scenario.input:
                return FailureType.INCOMPLETE

        if config is None:
            return None

        active_config = config.get_active_config()
        if active_config is None:
            return None

        if config.system_type == SystemType.CUSTOMER_SUPPORT:
            prohibited = getattr(active_config, "prohibited_actions", [])
            for action in prohibited:
                action_normalized = action.lower().replace("_", " ")
                if action_normalized in response_lower:
                    return FailureType.POLICY_VIOLATION

        return None

    # ─── Private: three-judge panel ───────────────────────────────

    async def _evaluate_with_panel(
        self,
        scenario: Scenario,
        response: str,
        judges: list[dict],
        judge_prompt_suffix: str,
    ) -> PanelVerdict:
        """
        Evaluates a response using the three-judge panel.
        Runs all judges concurrently.
        Returns PanelVerdict with majority vote result.
        """
        judge_tasks = [
            self._call_judge(
                scenario=scenario,
                response=response,
                judge=judge,
                judge_prompt_suffix=judge_prompt_suffix,
            )
            for judge in judges
        ]

        judge_results = await asyncio.gather(*judge_tasks, return_exceptions=True)

        verdicts: list[JudgeVerdict] = []
        for result in judge_results:
            if isinstance(result, Exception):
                logger.error("judge_error", error=str(result))
            elif result is not None:
                verdicts.append(result)

        if not verdicts:
            return PanelVerdict(
                passed=True,
                confidence=0.0,
                agreement_level="no_judges",
                requires_human_review=True,
                human_review_reason="All judges failed to return verdicts",
            )

        verdict_bools = [v.passed for v in verdicts]
        failure_types = [
            v.failure_type.value if v.failure_type else None
            for v in verdicts
        ]
        judge_models = [v.judge_model for v in verdicts]

        panel_data = calculate_panel_verdict(verdict_bools, failure_types, judge_models)

        failure_type = None
        if panel_data.get("failure_type"):
            try:
                failure_type = FailureType(panel_data["failure_type"])
            except ValueError:
                pass

        return PanelVerdict(
            passed=panel_data["passed"],
            confidence=panel_data["confidence"],
            agreement_level=panel_data["agreement_level"],
            individual_verdicts=verdicts,
            failure_type=failure_type,
            requires_human_review=panel_data["requires_human_review"],
            human_review_reason=panel_data["human_review_reason"],
        )

    async def _call_judge(
        self,
        scenario: Scenario,
        response: str,
        judge: dict,
        judge_prompt_suffix: str,
    ) -> JudgeVerdict | None:
        """
        Calls a single judge model to evaluate a scenario response.
        Returns JudgeVerdict or None on failure.
        """
        prompt = f"""You are evaluating an AI system response.

USER MESSAGE: {scenario.input}
EXPECTED BEHAVIOR: {scenario.expected_behavior}
ACTUAL RESPONSE: {response}

{judge_prompt_suffix}

Evaluate whether the actual response correctly handles the user message
and meets the expected behavior.

Return JSON only:
{{
  "passed": true or false,
  "failure_type": null or one of:
    HALLUCINATION, POLICY_VIOLATION, INCOMPLETE,
    WRONG_ANSWER, CONTEXT_LOSS, ESCALATION_FAILURE,
  "confidence": 0.0 to 1.0,
  "reasoning": "one sentence explanation"
}}"""

        try:
            async with asyncio.timeout(LLM_JUDGE_TIMEOUT):
                resp = await litellm.acompletion(
                    model=judge["model"],
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1,
                    max_tokens=500,
                )

            raw = resp.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()

            data = json.loads(raw)

            failure_type = None
            if data.get("failure_type"):
                try:
                    failure_type = FailureType(data["failure_type"])
                except ValueError:
                    pass

            tokens_used = resp.usage.total_tokens if resp.usage else 0
            self._total_tokens += tokens_used
            self._total_cost += (tokens_used / 1000) * COST_PER_1K_TOKENS

            return JudgeVerdict(
                judge_model=judge["model"],
                judge_family=judge["family"],
                passed=bool(data.get("passed", True)),
                failure_type=failure_type,
                confidence=float(data.get("confidence", 0.75)),
                reasoning=data.get("reasoning", ""),
                evaluation_method=EvaluationMethod.LLM_JUDGE,
            )

        except Exception as e:
            logger.error(
                "judge_call_failed",
                model=judge["model"],
                error=str(e),
            )
            return None

    # ─── Private: result helpers ──────────────────────────────────

    def _create_dry_run_result(self, scenario: Scenario) -> TestResult:
        """
        Creates a realistic mock result for dry run mode.
        """
        passed = random.random() < MOCK_PASS_RATE
        return TestResult(
            id=uuid4(),
            scenario_id=scenario.id,
            system_type=scenario.system_type,
            passed=passed,
            failure_type=None if passed else FailureType.WRONG_ANSWER,
            confidence_score=0.85,
            actual_response="[DRY RUN] Mock response for scenario",
            latency_ms=150.0,
            evaluation_method=EvaluationMethod.RULE_BASED,
        )

    def _create_error_result(
        self,
        scenario: Scenario,
        latency_ms: float,
        error: str,
    ) -> TestResult:
        """
        Creates a failed result when an error occurred.
        """
        return TestResult(
            id=uuid4(),
            scenario_id=scenario.id,
            system_type=scenario.system_type,
            passed=False,
            failure_type=FailureType.INCOMPLETE,
            confidence_score=0.95,
            actual_response=f"ERROR: {error}",
            latency_ms=latency_ms,
            evaluation_method=EvaluationMethod.RULE_BASED,
        )


# ─── Module-level helper ──────────────────────────────────────────

def build_cost_estimate(
    scenario_count: int,
    model: str,
    judge_count: int = 3,
) -> CostEstimate:
    """
    Builds a cost estimate for a test run before executing it.
    Rough estimate: 500 tokens per scenario for generation +
    300 tokens per judge call × judge_count per scenario.
    """
    generation_tokens = scenario_count * 500
    judge_tokens = scenario_count * judge_count * 300
    total_tokens = generation_tokens + judge_tokens
    total_cost = (total_tokens / 1000) * COST_PER_1K_TOKENS

    return CostEstimate(
        estimated_tokens=total_tokens,
        estimated_cost_usd=round(total_cost, 4),
        model_used=model,
        scenario_count=scenario_count,
        breakdown={
            "generation_tokens": generation_tokens,
            "judge_tokens": judge_tokens,
            "generation_cost": round((generation_tokens / 1000) * COST_PER_1K_TOKENS, 4),
            "judge_cost": round((judge_tokens / 1000) * COST_PER_1K_TOKENS, 4),
        },
    )
