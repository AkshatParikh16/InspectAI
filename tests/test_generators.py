import pytest

from inspectai.generators.scenario_generator import ScenarioGenerator
from inspectai.models.schemas import SystemType


@pytest.mark.asyncio
async def test_generate_returns_list() -> None:
    generator = ScenarioGenerator(system_type=SystemType.RAG)
    results = await generator.generate(SystemType.RAG, count=5)
    assert isinstance(results, list)


@pytest.mark.asyncio
async def test_generate_adversarial_returns_list() -> None:
    generator = ScenarioGenerator(system_type=SystemType.CUSTOMER_SUPPORT)
    results = await generator.generate_adversarial(SystemType.CUSTOMER_SUPPORT, count=5)
    assert isinstance(results, list)


def test_scenario_generator_default_model() -> None:
    generator = ScenarioGenerator(system_type=SystemType.MULTI_AGENT)
    assert generator.model is not None
    assert len(generator.model) > 0
