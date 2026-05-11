import time
from datetime import UTC, datetime

import duckdb
from pydantic import BaseModel

from inspectai.config import settings
from inspectai.models.schemas import SystemType


class SelfTestResult(BaseModel):
    passed: bool
    components_tested: list[str]
    results: dict
    duration_ms: float
    timestamp: datetime
    inspectai_version: str = "0.1.0"


class SelfTest:
    def _test_scenario_generator(self) -> tuple[bool, str]:
        try:
            from inspectai.generators.scenario_generator import ScenarioGenerator
            gen = ScenarioGenerator(system_type=SystemType.CUSTOMER_SUPPORT)
            assert gen.system_type == SystemType.CUSTOMER_SUPPORT
            return True, "ScenarioGenerator instantiates correctly"
        except Exception as e:
            return False, str(e)

    def _test_failure_analyzer(self) -> tuple[bool, str]:
        try:
            from inspectai.analyzers.failure_analyzer import FailureAnalyzer
            analyzer = FailureAnalyzer()
            assert hasattr(analyzer, "analyze")
            return True, "FailureAnalyzer instantiates correctly"
        except Exception as e:
            return False, str(e)

    def _test_fix_recommender(self) -> tuple[bool, str]:
        try:
            from inspectai.fixers.fix_recommender import FixRecommender
            recommender = FixRecommender()
            assert hasattr(recommender, "recommend")
            return True, "FixRecommender instantiates correctly"
        except Exception as e:
            return False, str(e)

    def _test_database(self) -> tuple[bool, str]:
        try:
            conn = duckdb.connect(":memory:")
            conn.execute("CREATE TABLE _self_test (id VARCHAR, value INTEGER)")
            conn.execute("INSERT INTO _self_test VALUES ('ping', 1)")
            row = conn.execute("SELECT value FROM _self_test WHERE id = 'ping'").fetchone()
            conn.close()
            assert row and row[0] == 1
            return True, "DuckDB in-memory read/write works"
        except Exception as e:
            return False, str(e)

    def _test_llm_connectivity(self) -> tuple[bool, str]:
        if settings.anthropic_api_key or settings.openai_api_key:
            return True, "LLM API key is configured"
        return False, "No LLM API key configured (set ANTHROPIC_API_KEY or OPENAI_API_KEY)"

    def run_self_test(self) -> SelfTestResult:
        start = time.perf_counter()
        tests = {
            "scenario_generator": self._test_scenario_generator,
            "failure_analyzer": self._test_failure_analyzer,
            "fix_recommender": self._test_fix_recommender,
            "database": self._test_database,
            "llm_connectivity": self._test_llm_connectivity,
        }
        results: dict[str, dict] = {}
        for name, fn in tests.items():
            ok, msg = fn()
            results[name] = {"passed": ok, "message": msg}

        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        return SelfTestResult(
            passed=all(r["passed"] for r in results.values()),
            components_tested=list(tests.keys()),
            results=results,
            duration_ms=duration_ms,
            timestamp=datetime.now(UTC),
        )
