"""
Learning engine for InspectAI.

Separate from the failure analyzer — handles all self-improvement
logic after analysis is complete.

Four learning layers:

Layer 1 — Episodic Memory
  Updates PersonaEffectiveness and ScenarioEffectiveness
  Scoped to specific system_config_hash — never bleeds to other systems

Layer 2 — GEPA Regression Generation
  Every failure automatically becomes a regression scenario
  Tagged to the specific system that produced it
  Built into permanent regression test library
  Never manually created

Layer 3 — Verbal Self-Correction
  After each run updates scenario generation strategy
  Scoped to system_config_hash only
  A scenario that failed for RetailCo is only deprioritized
  for RetailCo — never affects ShopEasy or any other system

Layer 4 — Fine-tuning Data Generation
  Failures become (input, correct_output) training pairs
  Company downloads and fine-tunes their open-source model
  On-policy learning — model learns from its own mistakes
"""

from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime
from uuid import uuid4

import structlog

from inspectai.analyzers.failure_analyzer import AnalysisResult
from inspectai.models.schemas import (
    DifficultyLevel,
    InspectAILearning,
    Scenario,
    ScenarioEffectiveness,
    SystemConfig,
    SystemType,
    TestResult,
)

logger = structlog.get_logger()

PERSONA_HIGH_VALUE_THRESHOLD = 0.40
PERSONA_RETIREMENT_THRESHOLD = 0.05
SCENARIO_HIGH_VALUE_THRESHOLD = 0.35


class LearningEngine:
    """
    Updates InspectAILearning after each test run.
    All learning is scoped to system_config_hash.

    Usage:
        engine = LearningEngine()
        updated_learning = await engine.learn(
            learning=learning,
            analysis=analysis,
            results=results,
            scenarios=scenarios,
            config=config,
        )
    """

    async def learn(
        self,
        learning: InspectAILearning,
        analysis: AnalysisResult,
        results: list[TestResult],
        scenarios: list[Scenario],
        config: SystemConfig,
    ) -> InspectAILearning:
        """
        Main entry point. Runs all four learning layers in sequence.
        Returns updated InspectAILearning object.
        """
        system_config_hash = self._hash_config(config)

        logger.info(
            "learning_started",
            system_config_hash=system_config_hash[:8],
            total_results=len(results),
            patterns_found=len(analysis.failure_patterns),
        )

        learning = self._update_episodic_memory(
            learning=learning,
            results=results,
            scenarios=scenarios,
            config=config,
            system_config_hash=system_config_hash,
        )

        learning = self._generate_regression_scenarios(
            learning=learning,
            results=results,
            scenarios=scenarios,
            system_config_hash=system_config_hash,
            config=config,
        )

        learning = self._update_scenario_generation_strategy(
            learning=learning,
            analysis=analysis,
            system_config_hash=system_config_hash,
            config=config,
        )

        learning = self._generate_finetuning_pairs(
            learning=learning,
            results=results,
            scenarios=scenarios,
            system_config_hash=system_config_hash,
        )

        learning.last_learning_update = datetime.now(UTC)

        logger.info(
            "learning_complete",
            scenario_effectiveness_count=len(learning.scenario_effectiveness),
            total_corrections=learning.total_corrections,
        )

        return learning

    # ─── Private: config hash ─────────────────────────────────────

    def _hash_config(self, config: SystemConfig) -> str:
        """
        Creates a unique fingerprint for a SystemConfig.
        Same company + same policies = same hash.
        Scopes all learning to specific systems.
        """
        active = config.get_active_config()
        if active is None:
            return "unknown"

        key_parts = [
            str(config.system_type),
            getattr(active, "company_name", ""),
            getattr(active, "industry", ""),
            str(getattr(active, "max_refund_amount", "")),
            str(getattr(active, "return_window_days", "")),
            str(getattr(active, "hallucination_tolerance", "")),
        ]

        raw = "|".join(key_parts)
        return hashlib.sha256(raw.encode()).hexdigest()[:16]

    # ─── Layer 1: Episodic memory ─────────────────────────────────

    def _update_episodic_memory(
        self,
        learning: InspectAILearning,
        results: list[TestResult],
        scenarios: list[Scenario],
        config: SystemConfig,
        system_config_hash: str,
    ) -> InspectAILearning:
        """
        Updates ScenarioEffectiveness scoped to system_config_hash.
        A scenario that fails for RetailCo only affects RetailCo learning.
        """
        scenario_map = {str(s.id): s for s in scenarios}

        for result in results:
            scenario = scenario_map.get(str(result.scenario_id))
            if not scenario:
                continue

            found_failure = not result.passed

            pattern = (
                "|".join(sorted(scenario.tags))
                if scenario.tags
                else scenario.difficulty.value
            )
            scoped_pattern = f"{system_config_hash}:{pattern}"

            existing_se = next(
                (
                    se
                    for se in learning.scenario_effectiveness
                    if se.scenario_pattern == scoped_pattern
                    and se.system_type == config.system_type
                ),
                None,
            )

            if existing_se:
                new_times = existing_se.times_used + 1
                new_rate = (
                    existing_se.failure_rate * existing_se.times_used
                    + (1.0 if found_failure else 0.0)
                ) / new_times
                updated = existing_se.model_copy(
                    update={"times_used": new_times, "failure_rate": new_rate}
                )
                learning.scenario_effectiveness = [
                    updated if se.scenario_pattern == scoped_pattern else se
                    for se in learning.scenario_effectiveness
                ]
            else:
                learning.scenario_effectiveness.append(
                    ScenarioEffectiveness(
                        scenario_pattern=scoped_pattern,
                        failure_rate=1.0 if found_failure else 0.0,
                        times_used=1,
                        system_type=config.system_type,
                    )
                )

        logger.info(
            "episodic_memory_updated",
            scenario_patterns=len(learning.scenario_effectiveness),
        )

        return learning

    # ─── Layer 2: GEPA regression generation ─────────────────────

    def _generate_regression_scenarios(
        self,
        learning: InspectAILearning,
        results: list[TestResult],
        scenarios: list[Scenario],
        system_config_hash: str,
        config: SystemConfig,
    ) -> InspectAILearning:
        """
        Every failure automatically becomes a regression scenario.
        Stored in learning cache, loaded by ScenarioGenerator before each run.
        Scoped to system_config_hash — regressions never cross systems.
        """
        scenario_map = {str(s.id): s for s in scenarios}

        cache_key = f"regressions_{system_config_hash}"
        existing = learning.conversation_insights_cache.get(cache_key, [])
        existing_inputs = {r.get("input", "") for r in existing}
        new_count = 0

        for result in results:
            if not result.passed and result.failure_type:
                scenario = scenario_map.get(str(result.scenario_id))
                if not scenario or scenario.input in existing_inputs:
                    continue

                existing.append({
                    "id": str(uuid4()),
                    "input": scenario.input,
                    "expected_behavior": scenario.expected_behavior,
                    "difficulty": DifficultyLevel.HARD.value,
                    "tags": [
                        "regression",
                        f"regression_{system_config_hash[:8]}",
                        result.failure_type.value.lower(),
                        f"run_{datetime.now(UTC).strftime('%Y%m%d')}",
                    ],
                    "system_type": scenario.system_type.value,
                    "created_at": datetime.now(UTC).isoformat(),
                })
                existing_inputs.add(scenario.input)
                new_count += 1

        learning.conversation_insights_cache[cache_key] = existing

        if new_count:
            logger.info(
                "regression_scenarios_generated",
                new_regressions=new_count,
                total_regressions=len(existing),
                system_hash=system_config_hash[:8],
            )

        return learning

    def get_regression_scenarios(
        self,
        learning: InspectAILearning,
        config: SystemConfig,
    ) -> list[Scenario]:
        """
        Retrieves regression scenarios for a specific system.
        Called by ScenarioGenerator before each run.
        """
        system_config_hash = self._hash_config(config)
        cache_key = f"regressions_{system_config_hash}"
        stored = learning.conversation_insights_cache.get(cache_key, [])

        scenarios = []
        for item in stored:
            try:
                scenario = Scenario(
                    system_type=SystemType(item["system_type"]),
                    input=item["input"],
                    expected_behavior=item["expected_behavior"],
                    difficulty=DifficultyLevel(item.get("difficulty", "HARD")),
                    tags=item.get("tags", ["regression"]),
                )
                scenarios.append(scenario)
            except Exception as e:
                logger.warning("regression_scenario_load_failed", error=str(e))

        logger.info(
            "regression_scenarios_loaded",
            count=len(scenarios),
            system_hash=system_config_hash[:8],
        )

        return scenarios

    # ─── Layer 3: Verbal self-correction ─────────────────────────

    def _update_scenario_generation_strategy(
        self,
        learning: InspectAILearning,
        analysis: AnalysisResult,
        system_config_hash: str,
        config: SystemConfig,
    ) -> InspectAILearning:
        """
        Updates scenario generation hints for this specific system.
        Increases weight for failure types found — targets them harder next run.
        Scoped entirely to system_config_hash.
        """
        strategy_key = f"strategy_{system_config_hash}"
        existing_strategy = learning.conversation_insights_cache.get(
            strategy_key, {}
        )

        failure_weights = existing_strategy.get("failure_weights", {})
        for pattern in analysis.failure_patterns:
            ft = pattern.failure_type.value
            current_weight = failure_weights.get(ft, 1.0)
            failure_weights[ft] = min(3.0, current_weight + 0.5)

        found_patterns = [
            {
                "cluster_label": p.cluster_label,
                "root_cause": p.root_cause,
                "failure_type": p.failure_type.value,
                "count": p.scenario_count,
            }
            for p in analysis.failure_patterns[:10]
        ]

        existing_strategy.update({
            "failure_weights": failure_weights,
            "last_pass_rate": analysis.test_run.pass_rate,
            "found_patterns": found_patterns,
            "last_updated": datetime.now(UTC).isoformat(),
            "system_type": config.system_type.value,
            "run_count": existing_strategy.get("run_count", 0) + 1,
        })

        learning.conversation_insights_cache[strategy_key] = existing_strategy

        logger.info(
            "generation_strategy_updated",
            system_hash=system_config_hash[:8],
            failure_weights=failure_weights,
            run_count=existing_strategy["run_count"],
        )

        return learning

    def get_generation_strategy(
        self,
        learning: InspectAILearning,
        config: SystemConfig,
    ) -> dict:
        """
        Returns generation strategy hints for this specific system.
        Called by ScenarioGenerator before generating scenarios.
        """
        system_config_hash = self._hash_config(config)
        strategy_key = f"strategy_{system_config_hash}"
        return learning.conversation_insights_cache.get(strategy_key, {})

    # ─── Layer 4: Fine-tuning data generation ────────────────────

    def _generate_finetuning_pairs(
        self,
        learning: InspectAILearning,
        results: list[TestResult],
        scenarios: list[Scenario],
        system_config_hash: str,
    ) -> InspectAILearning:
        """
        Generates (input, correct_output) training pairs from failures.
        On-policy learning — the model learns from its own mistakes.
        Companies download these and fine-tune their open-source models.
        """
        scenario_map = {str(s.id): s for s in scenarios}
        finetuning_key = f"finetuning_{system_config_hash}"
        existing_pairs = learning.conversation_insights_cache.get(
            finetuning_key, []
        )

        new_pairs = []
        for result in results:
            if not result.passed and result.failure_type:
                scenario = scenario_map.get(str(result.scenario_id))
                if not scenario:
                    continue

                new_pairs.append({
                    "id": str(uuid4()),
                    "input": scenario.input,
                    "wrong_output": result.actual_response,
                    "correct_output": scenario.expected_behavior,
                    "failure_type": result.failure_type.value,
                    "difficulty": scenario.difficulty.value,
                    "tags": scenario.tags,
                    "created_at": datetime.now(UTC).isoformat(),
                    "system_config_hash": system_config_hash,
                })

        existing_pairs.extend(new_pairs)
        learning.conversation_insights_cache[finetuning_key] = existing_pairs

        if new_pairs:
            logger.info(
                "finetuning_pairs_generated",
                new_pairs=len(new_pairs),
                total_pairs=len(existing_pairs),
                system_hash=system_config_hash[:8],
            )

        return learning

    def export_finetuning_data(
        self,
        learning: InspectAILearning,
        config: SystemConfig,
        format: str = "jsonl",
    ) -> str:
        """
        Exports fine-tuning data for a specific system.
        Format options: jsonl (default), json
        Returns string content ready to save as a file.
        """
        system_config_hash = self._hash_config(config)
        finetuning_key = f"finetuning_{system_config_hash}"
        pairs = learning.conversation_insights_cache.get(finetuning_key, [])

        if format == "jsonl":
            lines = []
            for pair in pairs:
                entry = {
                    "messages": [
                        {"role": "user", "content": pair["input"]},
                        {"role": "assistant", "content": pair["correct_output"]},
                    ],
                    "metadata": {
                        "failure_type": pair["failure_type"],
                        "difficulty": pair["difficulty"],
                    },
                }
                lines.append(json.dumps(entry))
            return "\n".join(lines)

        return json.dumps(pairs, indent=2)
