from contextlib import asynccontextmanager

import duckdb
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from inspectai.config import settings
from inspectai.core.logging import get_logger, setup_logging
from inspectai.core.middleware import _stats, limiter, logging_middleware

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


@app.get("/")
async def root() -> dict:
    return {"message": "Welcome to InspectAI — Automated Adversarial Testing Pipeline"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("inspectai.main:app", host="0.0.0.0", port=8000, reload=True)
