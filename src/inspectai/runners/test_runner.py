"""
Test runner that executes scenarios against a target AI system endpoint.

Calls the target system with each scenario's input, records the actual response,
and scores the result against the expected behavior using an LLM-as-judge approach.
"""

import httpx

from inspectai.models.schemas import Scenario, TestResult


class TestRunner:
    """Runs test scenarios against a target AI system and records results."""

    def __init__(self, config: dict | None = None) -> None:
        self.config = config or {}
        self._client = httpx.AsyncClient(timeout=60.0)

    async def run(self, scenarios: list[Scenario], target_url: str) -> list[TestResult]:
        """
        Run all scenarios against the target URL and return results.

        Each scenario is sent as a POST request to `target_url`. Responses are
        scored by an LLM judge that compares the actual output to the expected
        behavior description.
        """
        # TODO: implement concurrent scenario execution with LLM scoring
        return []

    async def run_single(self, scenario: Scenario, target_url: str) -> TestResult:
        """
        Run a single scenario against the target URL.

        Measures end-to-end latency, captures the response, and delegates
        pass/fail scoring to the judge module.
        """
        # TODO: implement single scenario execution and scoring
        raise NotImplementedError
