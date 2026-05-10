# InspectAI

**Automated Adversarial Testing and Improvement Pipeline for AI Systems**

![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## What It Does

InspectAI automatically generates adversarial test scenarios for AI systems (RAG pipelines, customer support bots, multi-agent workflows), executes them against a live target endpoint, classifies failures by type (hallucination, policy violation, context loss, etc.), and produces prioritised, actionable fix recommendations — all without manual test authoring.

## How It Works

```
Generate → Test → Analyze → Fix
```

1. **Generate** — A LangGraph generator-critic agent pair creates diverse and adversarial scenarios tailored to your system type and difficulty distribution.
2. **Test** — The test runner fires each scenario at your target endpoint, measures latency, captures responses, and scores them with an LLM-as-judge.
3. **Analyze** — The failure analyzer aggregates results, classifies failure types, and computes pass rates and breakdowns.
4. **Fix** — The fix recommender generates concrete prompt improvements and guardrail suggestions, prioritised by frequency and severity.

## Tech Stack

| Tool | Role |
|---|---|
| **FastAPI** | REST API layer for triggering runs and fetching results |
| **LangGraph** | Agent orchestration for generator and critic pipelines |
| **LiteLLM** | Unified LLM gateway supporting Anthropic, OpenAI, and more |
| **Pydantic v2** | Data validation and serialization |
| **Pydantic Settings** | Environment-based configuration management |
| **DuckDB** | Embedded analytical database for test result storage |
| **Polars** | High-performance dataframe processing for analytics |
| **Langfuse** | LLM observability — traces, scores, and cost tracking |
| **Streamlit** | Interactive dashboard for results and recommendations |
| **uv** | Fast Python package and project manager |
| **ruff** | Linting and formatting |
| **ty** | Static type checking |
| **Docker** | Containerised deployment |
| **MCP** | AI agent integration interface |

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/your-org/InspectAI.git
cd InspectAI

# 2. Install dependencies
uv sync

# 3. Copy and populate the environment file
cp .env.example .env
# Edit .env with your API keys

# 4. Run the API
uv run uvicorn inspectai.main:app --reload

# 5. Run the dashboard (separate terminal)
uv run streamlit run src/inspectai/dashboard/app.py

# 6. Run tests
uv run pytest -v
```

Docker:

```bash
docker compose up --build
```

- API: http://localhost:8000
- Dashboard: http://localhost:8501
- API docs: http://localhost:8000/docs

## Project Structure

```
InspectAI/
├── pyproject.toml              # Project config and dependencies
├── .python-version             # Pinned Python version (3.12.10)
├── .env.example                # Environment variable template
├── Dockerfile                  # Production container image
├── docker-compose.yml          # Multi-service orchestration
├── .github/workflows/test.yml  # CI pipeline
├── src/
│   └── inspectai/
│       ├── main.py             # FastAPI application
│       ├── config.py           # Pydantic Settings configuration
│       ├── core/               # Shared utilities
│       ├── generators/         # Scenario generation agents
│       ├── runners/            # Test execution engine
│       ├── analyzers/          # Failure classification
│       ├── fixers/             # Fix recommendation engine
│       ├── models/             # Pydantic schemas
│       └── dashboard/          # Streamlit UI
└── tests/
    ├── test_generators.py
    ├── test_runners.py
    └── test_analyzers.py
```

## Roadmap

- **Continuous monitoring mode** — run scheduled test suites against production endpoints and alert on pass-rate regressions.
- **Scenario library** — community-contributed scenario packs for common system types (medical QA, legal RAG, coding assistants).
- **Auto-remediation** — automatically apply approved prompt fixes and re-run affected scenarios to verify the improvement.

## License

MIT
