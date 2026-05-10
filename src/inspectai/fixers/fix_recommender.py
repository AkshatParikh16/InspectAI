"""
Fix recommender that generates actionable remediation suggestions for identified failures.

Given a TestRun with categorized failures, produces prioritized FixRecommendation objects
that include concrete prompt improvements and guardrail suggestions.
"""

from inspectai.models.schemas import FailureType, FixRecommendation, TestRun


class FixRecommender:
    """Generates fix recommendations for AI system failures."""

    async def recommend(self, test_run: TestRun) -> list[FixRecommendation]:
        """
        Generate a prioritized list of FixRecommendation objects for a completed TestRun.

        Iterates over failure_breakdown entries, calls generate_prompt_fix and
        generate_guardrail for each failure type, and ranks recommendations by
        occurrence frequency and severity.
        """
        # TODO: implement recommendation generation from test run failure breakdown
        return []

    async def generate_prompt_fix(self, failure_type: FailureType) -> str:
        """
        Generate a prompt-level fix for the given failure type.

        Returns a concrete system-prompt addition or modification that addresses the
        root cause of the failure, using few-shot examples where applicable.
        """
        # TODO: implement LLM-based prompt fix generation
        raise NotImplementedError

    async def generate_guardrail(self, failure_type: FailureType) -> str:
        """
        Generate a guardrail implementation suggestion for the given failure type.

        Returns a code snippet or configuration change that adds input/output
        validation to prevent the failure type from occurring in production.
        """
        # TODO: implement guardrail generation
        raise NotImplementedError
