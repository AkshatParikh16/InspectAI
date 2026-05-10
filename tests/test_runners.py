import pytest

from inspectai.runners.test_runner import TestRunner


@pytest.mark.asyncio
async def test_run_empty_scenarios_returns_list() -> None:
    runner = TestRunner()
    results = await runner.run(scenarios=[], target_url="http://localhost:8000")
    assert isinstance(results, list)
    assert len(results) == 0


def test_runner_accepts_config() -> None:
    runner = TestRunner(config={"timeout": 30})
    assert runner.config["timeout"] == 30


@pytest.mark.asyncio
async def test_run_single_not_implemented() -> None:
    from inspectai.models.schemas import DifficultyLevel, Scenario, SystemType

    runner = TestRunner()
    scenario = Scenario(
        system_type=SystemType.RAG,
        input="test input",
        expected_behavior="expected output",
        difficulty=DifficultyLevel.EASY,
    )
    with pytest.raises(NotImplementedError):
        await runner.run_single(scenario, target_url="http://localhost:8000")
