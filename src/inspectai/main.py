import os
from contextlib import asynccontextmanager

import duckdb
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from inspectai.api.runs import router as runs_router
from inspectai.config import settings
from inspectai.core.demo import DemoMode
from inspectai.core.logging import get_logger, setup_logging
from inspectai.core.middleware import _stats, limiter, logging_middleware
from inspectai.core.self_test import SelfTest, SelfTestResult
from inspectai.integrations.policychat import PolicyChatIntegration

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("InspectAI starting", environment=settings.environment, version="0.1.0")
    yield
    logger.info("InspectAI shutting down")


app = FastAPI(
    title="InspectAI",
    version="0.1.0",
    description="Automated Adversarial Testing and Improvement Pipeline for AI Systems",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(BaseHTTPMiddleware, dispatch=logging_middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(runs_router)

# Serve the React dashboard at /dashboard
_dashboard_dir = os.path.join(os.path.dirname(__file__), "dashboard")
if os.path.isdir(_dashboard_dir):
    app.mount("/dashboard", StaticFiles(directory=_dashboard_dir, html=True), name="dashboard")


@app.get("/health")
async def health() -> dict:
    db_status = "ok"
    try:
        conn = duckdb.connect(settings.database_path)
        conn.execute("SELECT 1")
        conn.close()
    except Exception:
        db_status = "unavailable"

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "version": "0.1.0",
        "environment": settings.environment,
        "database": db_status,
    }


@app.get("/metrics")
async def metrics() -> dict:
    return {
        "requests_total": _stats["requests_total"],
        "tests_run": _stats["tests_run"],
        "max_concurrent_tests": settings.max_concurrent_tests,
        "rate_limit_per_minute": settings.rate_limit_per_minute,
    }


@app.get("/demo")
async def demo() -> dict:
    d = DemoMode()
    config = d.get_demo_config()
    scenarios = d.get_demo_scenarios()
    results = d.get_demo_results()
    return {
        "config": config.model_dump(),
        "scenarios": [s.model_dump() for s in scenarios],
        "results": results.model_dump(),
    }


@app.get("/self-test")
async def self_test() -> SelfTestResult:
    return SelfTest().run_self_test()


@app.get("/")
async def root() -> dict:
    return {
        "message": "Welcome to InspectAI — AI Quality Monitoring Platform",
        "portal": "/dashboard",
        "api_docs": "/docs",
    }


@app.get("/integrations/policychat/health")
async def policychat_health():
    """
    Checks if PolicyChat is running and Ollama is available.
    Run this before triggering a test to verify everything is ready.
    """
    integration = PolicyChatIntegration()
    return await integration.check_health()


@app.post("/integrations/policychat/test")
async def test_policychat(
    scenario_count: int = 50,
    dry_run: bool = True,
    budget_limit_usd: float = 5.0,
):
    """
    Runs a complete InspectAI test against PolicyChat.

    What happens automatically:
    1. Generates a synthetic insurance policy PDF
    2. Uploads it to PolicyChat via POST /ingest
    3. Generates grounded test scenarios from the PDF content
    4. Fires scenarios at PolicyChat POST /query endpoint
    5. Analyzes failures using HDBSCAN clustering
    6. Generates concrete fix recommendations
    7. Returns full results

    Parameters:
    - scenario_count: how many scenarios to generate (default 50)
    - dry_run: if True skips real calls — tests InspectAI setup (default True)
    - budget_limit_usd: stops if LLM cost exceeds this (default $5)

    Requirements:
    - PolicyChat running at http://localhost:8001
    - Ollama running: ollama serve
    """
    integration = PolicyChatIntegration()
    return await integration.run_full_test(
        scenario_count=scenario_count,
        dry_run=dry_run,
        budget_limit_usd=budget_limit_usd,
    )


@app.post("/integrations/policychat/query")
async def test_single_policychat_query(
    query: str,
    doc_id: str | None = None,
):
    """
    Tests a single query against PolicyChat manually.
    Useful for quick verification during development.

    Parameters:
    - query: the question to ask PolicyChat
    - doc_id: document to query against (from previous /ingest call)
    """
    integration = PolicyChatIntegration()
    return await integration.test_single_query(
        query=query,
        doc_id=doc_id,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("inspectai.main:app", host="0.0.0.0", port=8000, reload=True)
