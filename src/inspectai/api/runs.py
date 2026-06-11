"""
Run management API for InspectAI dashboard.

Stores runs in DuckDB and executes the full evaluation pipeline
(scenario generation → test runner → failure analysis → fix recommendations)
as a background task.
"""

from __future__ import annotations

import asyncio
import json
import os
import uuid
from datetime import datetime
from typing import Any

import duckdb
import structlog
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field

logger = structlog.get_logger()

router = APIRouter(prefix="/api/runs", tags=["runs"])

_SCHEMA = """
CREATE TABLE IF NOT EXISTS runs (
    id              VARCHAR PRIMARY KEY,
    created_at      VARCHAR NOT NULL,
    company_name    VARCHAR NOT NULL,
    system_type     VARCHAR NOT NULL,
    target_model    VARCHAR NOT NULL,
    status          VARCHAR NOT NULL DEFAULT 'running',
    pass_rate       DOUBLE,
    total_scenarios INTEGER,
    total_failures  INTEGER,
    run_cost_usd    DOUBLE,
    config_json     VARCHAR,
    results_json    VARCHAR,
    analysis_json   VARCHAR,
    fixes_json      VARCHAR,
    error_message   VARCHAR
)
"""


def _db_path() -> str:
    from inspectai.config import settings
    path = settings.database_path
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    return path


def _connect() -> duckdb.DuckDBPyConnection:
    conn = duckdb.connect(_db_path())
    conn.execute(_SCHEMA)
    return conn


def _update_run(run_id: str, updates: dict[str, Any]) -> None:
    conn = _connect()
    pairs = ", ".join(f"{k} = ?" for k in updates)
    conn.execute(f"UPDATE runs SET {pairs} WHERE id = ?", [*updates.values(), run_id])
    conn.close()


# ── Request / response models ─────────────────────────────────────────────────

class PolicyInput(BaseModel):
    refund_threshold: float = 50.0
    return_window_days: int = 30
    max_discount_percent: float = 15.0
    escalate_on_keywords: list[str] = ["manager", "supervisor", "legal"]
    prohibited_actions: list[str] = []


class StartRunRequest(BaseModel):
    company_name: str
    industry: str = "retail"
    system_type: str = "CUSTOMER_SUPPORT"
    target_model: str = "claude-sonnet-4-6"
    target_endpoint: str
    api_key: str = ""
    scenario_count: int = Field(default=20, ge=5, le=500)
    dry_run: bool = False
    policy: PolicyInput = Field(default_factory=PolicyInput)


class RunSummary(BaseModel):
    id: str
    company_name: str
    system_type: str
    status: str
    pass_rate: float | None = None
    total_scenarios: int | None = None
    total_failures: int | None = None
    run_cost_usd: float | None = None
    created_at: str
    error_message: str | None = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[RunSummary])
async def list_runs() -> list[RunSummary]:
    conn = _connect()
    rows = conn.execute(
        """SELECT id, company_name, system_type, status, pass_rate,
                  total_scenarios, total_failures, run_cost_usd, created_at, error_message
           FROM runs ORDER BY created_at DESC LIMIT 100"""
    ).fetchall()
    conn.close()
    return [
        RunSummary(
            id=r[0], company_name=r[1], system_type=r[2], status=r[3],
            pass_rate=r[4], total_scenarios=r[5], total_failures=r[6],
            run_cost_usd=r[7], created_at=r[8], error_message=r[9],
        )
        for r in rows
    ]


@router.post("", status_code=202)
async def start_run(body: StartRunRequest, bg: BackgroundTasks) -> dict:
    run_id = uuid.uuid4().hex[:8]
    conn = _connect()
    conn.execute(
        """INSERT INTO runs
           (id, created_at, company_name, system_type, target_model, status, config_json)
           VALUES (?, ?, ?, ?, ?, 'running', ?)""",
        [
            run_id,
            datetime.utcnow().isoformat(),
            body.company_name,
            body.system_type,
            body.target_model,
            body.model_dump_json(),
        ],
    )
    conn.close()
    bg.add_task(_execute_run, run_id, body)
    return {"run_id": run_id, "status": "running"}


@router.get("/{run_id}")
async def get_run(run_id: str) -> dict:
    conn = _connect()
    row = conn.execute("SELECT * FROM runs WHERE id = ?", [run_id]).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")

    cols = [
        "id", "created_at", "company_name", "system_type", "target_model",
        "status", "pass_rate", "total_scenarios", "total_failures", "run_cost_usd",
        "config_json", "results_json", "analysis_json", "fixes_json", "error_message",
    ]
    d = dict(zip(cols, row))
    for key in ("config_json", "results_json", "analysis_json", "fixes_json"):
        raw = d.get(key)
        if raw:
            try:
                d[key] = json.loads(raw)
            except Exception:
                pass
    return d


@router.delete("/{run_id}", status_code=204)
async def delete_run(run_id: str) -> None:
    conn = _connect()
    conn.execute("DELETE FROM runs WHERE id = ?", [run_id])
    conn.close()


# ── Background pipeline ───────────────────────────────────────────────────────

async def _execute_run(run_id: str, body: StartRunRequest) -> None:
    """Full evaluation pipeline: generate → test → analyze → fix."""
    from inspectai.models.schemas import (
        CustomerSupportConfig,
        DeploymentStatus,
        EscalationConfig,
        JudgeConfig,
        ModelFamily,
        SystemConfig,
        SystemType,
        TargetAPIConfig,
        TestRunConfig,
    )
    from inspectai.generators.scenario_generator import ScenarioGenerator
    from inspectai.runners.test_runner import TestRunner
    from inspectai.analyzers.failure_analyzer import FailureAnalyzer
    from inspectai.fixers.fix_recommender import FixRecommender

    logger.info("pipeline_start", run_id=run_id, company=body.company_name, system=body.system_type)

    try:
        p = body.policy

        # ── Build SystemConfig ─────────────────────────────────────
        if body.system_type == "CUSTOMER_SUPPORT":
            active_cfg = CustomerSupportConfig(
                company_name=body.company_name,
                industry=body.industry,
                escalation=EscalationConfig(
                    refund_threshold=p.refund_threshold,
                    max_discount_percent=p.max_discount_percent,
                    escalate_on_keywords=p.escalate_on_keywords,
                ),
                max_refund_amount=p.refund_threshold,
                return_window_days=p.return_window_days,
                prohibited_actions=p.prohibited_actions,
            )
            config = SystemConfig(
                system_type=SystemType.CUSTOMER_SUPPORT,
                customer_support=active_cfg,
            )
        else:
            try:
                st = SystemType(body.system_type)
            except ValueError:
                st = SystemType.CUSTOMER_SUPPORT
            config = SystemConfig(system_type=st)

        run_config = TestRunConfig(
            dry_run=body.dry_run,
            max_scenarios=body.scenario_count,
            target_url=body.target_endpoint,
            target_api_config=TargetAPIConfig(url=body.target_endpoint),
            deployment_status=DeploymentStatus.POST_DEPLOYMENT,
        )

        # ── 1. Generate scenarios ──────────────────────────────────
        generator = ScenarioGenerator()
        scenarios = await generator.generate(config=config, run_config=run_config)
        scenarios = scenarios[: body.scenario_count]
        logger.info("scenarios_generated", run_id=run_id, count=len(scenarios))

        # ── 2. Run scenarios ───────────────────────────────────────
        runner = TestRunner(model=body.target_model)
        results = await runner.run(
            scenarios=scenarios,
            target_url=body.target_endpoint,
            config=config,
            run_config=run_config,
        )
        logger.info("tests_complete", run_id=run_id, results=len(results))

        passed = sum(1 for r in results if r.passed)
        failed = len(results) - passed
        pass_rate = passed / len(results) if results else 0.0

        results_data = {
            "pass_rate": pass_rate,
            "total_scenarios": len(results),
            "passed": passed,
            "failed": failed,
            "results": [r.model_dump(mode="json") for r in results],
        }

        # ── 3. Analyze failures ────────────────────────────────────
        analyzer = FailureAnalyzer()
        analysis = await analyzer.analyze(
            results=results,
            scenarios=scenarios,
            config=config,
            run_config=run_config,
        )

        # ── 4. Fix recommendations ─────────────────────────────────
        recommender = FixRecommender()
        fix_report = await recommender.recommend(analysis=analysis, config=config)

        _update_run(run_id, {
            "status": "completed",
            "pass_rate": pass_rate,
            "total_scenarios": len(results),
            "total_failures": failed,
            "run_cost_usd": round((analysis.analysis_cost_usd or 0) + (fix_report.generation_cost_usd or 0), 4),
            "results_json": json.dumps(results_data),
            "analysis_json": analysis.model_dump_json(),
            "fixes_json": fix_report.model_dump_json(),
        })
        logger.info("pipeline_complete", run_id=run_id, pass_rate=pass_rate)

    except Exception as exc:
        logger.exception("pipeline_failed", run_id=run_id, error=str(exc))
        _update_run(run_id, {"status": "failed", "error_message": str(exc)[:500]})
