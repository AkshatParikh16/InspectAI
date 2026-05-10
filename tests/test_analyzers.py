import pytest

from inspectai.analyzers.failure_analyzer import FailureAnalyzer


@pytest.mark.asyncio
async def test_analyze_not_implemented() -> None:
    analyzer = FailureAnalyzer()
    with pytest.raises(NotImplementedError):
        await analyzer.analyze([])


@pytest.mark.asyncio
async def test_get_failure_summary_not_implemented() -> None:
    from datetime import UTC, datetime

    from inspectai.models.schemas import SystemType, TestRun

    analyzer = FailureAnalyzer()
    test_run = TestRun(
        system_type=SystemType.RAG,
        total_scenarios=10,
        passed=8,
        failed=2,
        pass_rate=0.8,
        started_at=datetime.now(UTC),
    )
    with pytest.raises(NotImplementedError):
        await analyzer.get_failure_summary(test_run)
