# InspectAI

**Continuous AI quality monitoring for chatbots and conversational systems.**

InspectAI is a self-hosted evaluation platform that continuously tests your AI chatbot against adversarial scenarios, judges responses with a multi-model panel, clusters failures by type, and generates prioritised fix recommendations — all without requiring any changes to your chatbot's code.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    InspectAI Server                         │
│                                                             │
│  FastAPI (/api/runs) ──► Scenario Generator                 │
│       │                       │ generate adversarial inputs │
│       │                       ▼                             │
│       │               Test Runner ──► POST /your/endpoint   │
│       │                       │         (your chatbot)      │
│       │                       ▼                             │
│       │               3-Judge Panel                         │
│       │           (Prometheus + GPT + Claude)               │
│       │                       │                             │
│       │               Failure Analyzer                      │
│       │               (HDBSCAN clustering)                  │
│       │                       │                             │
│       │               Fix Recommender                       │
│       ▼                       │                             │
│   DuckDB ◄────────────────────┘                             │
│       │                                                     │
│  React Dashboard ◄── served at /dashboard                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/your-org/inspectai.git
cd inspectai
pip install uv      # or: pip install -e ".[dev]"
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
HUGGINGFACE_TOKEN=hf_...    # for Prometheus (free judge)
DATABASE_PATH=data/runs.db
DEFAULT_MODEL=claude-sonnet-4-6
```

### 3. Run the server

```bash
uv run python -m inspectai.main
# or:
python -m inspectai.main
```

Server starts at `http://localhost:8000`.  
Dashboard: `http://localhost:8000/dashboard`

---

## Integration Guide

### HTTP contract

InspectAI tests your chatbot by sending a plain JSON POST to your configured endpoint. Your endpoint must accept:

```http
POST https://your-api.com/chat
Authorization: Bearer <your-api-key>
Content-Type: application/json

{ "message": "<adversarial scenario input>" }
```

And return:

```json
{ "message": "<chatbot response>" }
```

The `message` key names are configurable. If your API uses a different structure (e.g. `{ "data": { "reply": "..." } }`), set `message_field` and `response_field` in Settings → API Configuration.

### Configuring your endpoint

1. Open the InspectAI dashboard and sign in (or create an account).
2. Go to **Settings**.
3. Fill in:
   - **Company / Bot Name** — identifies your organisation across runs.
   - **Chatbot API Endpoint** — the URL InspectAI will POST to.
   - **API Key** — sent as `Authorization: Bearer <key>` (session-only, never stored).
4. Click **Start Monitoring Cycle**.

### What InspectAI learns over time

| Maturity | Trigger | Strategy |
|----------|---------|----------|
| `NEW` | First 1–2 runs | Broad coverage — all failure types equally weighted |
| `RUNNING` | 3+ runs | Targeted — re-tests known weak spots, tracks regressions |
| `RELIABLE` | Pass rate > 90% for 3+ runs | Adversarial — maximum difficulty, edge-case stress |

You can override the detected maturity in Settings → Scenario Generation.

---

## Dashboard Walkthrough

| Page | Purpose |
|------|---------|
| **Dashboard** | KPI cards (pass rate, issue count, quality grade), trend chart, recent runs |
| **Issues** | Failure detail table grouped by type; select a run from the timeline |
| **Remediation** | Prioritised fix plan — each fix card shows impact, effort, and implementation steps |
| **Scenarios** | Full list of all tested scenarios (pass + fail) with 3-judge verdict detail panel |
| **Reports** | Download CSV / JSON reports for a selected run |
| **Settings** | Configure endpoint, policies, API config, tone, compliance, scenario strategy |
| **Integration** | Interactive guide: HTTP contract, lifecycle, quick-start checklist |

---

## API Reference

### `GET /health`

```json
{ "status": "healthy", "version": "0.1.0" }
```

### `GET /demo`

Returns a static ShopEasy demo `TestRun` — used by the dashboard's demo mode.

### `GET /api/runs`

Returns the last 100 runs for the current instance.

```json
[
  {
    "id": "a1b2c3d4",
    "company_name": "Acme Corp",
    "system_type": "CUSTOMER_SUPPORT",
    "status": "completed",
    "pass_rate": 0.82,
    "total_scenarios": 50,
    "total_failures": 9,
    "run_cost_usd": 0.61,
    "created_at": "2026-06-11T18:00:00"
  }
]
```

### `POST /api/runs`

Start a new monitoring cycle.

**Request body:**

```json
{
  "company_name": "Acme Corp",
  "industry": "retail",
  "system_type": "CUSTOMER_SUPPORT",
  "target_model": "claude-sonnet-4-6",
  "target_endpoint": "https://api.acme.com/v1/chat",
  "api_key": "sk-...",
  "scenario_count": 50,
  "dry_run": false,
  "policy": {
    "refund_threshold": 50.0,
    "return_window_days": 30,
    "max_discount_percent": 15.0,
    "escalate_on_keywords": ["manager", "legal"],
    "prohibited_actions": [],
    "chatbot_description": "Customer support bot for e-commerce",
    "use_case_categories": ["returns", "billing", "shipping"],
    "allowed_actions": ["lookup_order", "process_return"],
    "sentiment_threshold": 0.3,
    "max_turns_before_escalate": 5,
    "operating_hours": "9am-5pm EST Mon-Fri",
    "after_hours_behavior": "ticket",
    "formality": "professional",
    "language": "en",
    "empathy_required": true,
    "gdpr_enabled": false,
    "hipaa_enabled": false,
    "pci_dss_enabled": false,
    "pii_redaction": false,
    "data_residency": null,
    "message_field": "message",
    "response_field": "message",
    "extra_fields": {},
    "deployment_status": "POST_DEPLOYMENT",
    "generation_strategy": "SMART_MIX",
    "system_maturity": null
  }
}
```

**Response (202 Accepted):**

```json
{ "run_id": "a1b2c3d4", "status": "running" }
```

The pipeline runs as a background task. Poll `GET /api/runs/{run_id}` for results.

### `GET /api/runs/{run_id}`

Returns the full run including `results_json`, `analysis_json`, and `fixes_json`.

### `DELETE /api/runs/{run_id}`

Deletes a run record.

---

## Configuration Reference

All `policy` fields in `POST /api/runs`:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `refund_threshold` | float | 50.0 | Escalate refund requests above this amount |
| `return_window_days` | int | 30 | Reject returns beyond this window |
| `max_discount_percent` | float | 15.0 | Max autonomous discount before escalation |
| `escalate_on_keywords` | list[str] | `["manager","supervisor","legal"]` | Trigger human escalation |
| `prohibited_actions` | list[str] | `[]` | Actions the bot must never perform |
| `chatbot_description` | str | null | Free-text description for scenario targeting |
| `use_case_categories` | list[str] | `[]` | Topic areas (e.g. "returns", "billing") |
| `allowed_actions` | list[str] | `[]` | Actions the bot CAN perform |
| `sentiment_threshold` | float | 0.3 | Escalate if detected sentiment drops below this |
| `max_turns_before_escalate` | int | 5 | Force escalation after N turns |
| `operating_hours` | str | null | e.g. `"9am-5pm EST Mon-Fri"` |
| `after_hours_behavior` | str | `"ticket"` | `ticket` / `email` / `voicemail` / `self_serve` |
| `formality` | str | `"professional"` | `casual` / `professional` / `formal` / `technical` |
| `language` | str | `"en"` | ISO 639-1 code |
| `empathy_required` | bool | true | Test acknowledgement of frustration |
| `gdpr_enabled` | bool | false | Enable GDPR compliance scenarios |
| `hipaa_enabled` | bool | false | Enable HIPAA compliance scenarios |
| `pci_dss_enabled` | bool | false | Enable PCI-DSS compliance scenarios |
| `pii_redaction` | bool | false | Verify PII is never echoed back |
| `data_residency` | str | null | `EU` / `US` / `APAC` / `UK` |
| `message_field` | str | `"message"` | JSON key to send the scenario input in |
| `response_field` | str | `"message"` | Dot-path to extract chatbot reply |
| `extra_fields` | dict | `{}` | Additional fields merged into every request |
| `deployment_status` | str | `"POST_DEPLOYMENT"` | `PRE_DEPLOYMENT` or `POST_DEPLOYMENT` |
| `generation_strategy` | str | `"SMART_MIX"` | `SMART_MIX` / `FROM_SCRATCH` / `TARGET_FAILURES` / `ADVERSARIAL` |
| `system_maturity` | str | null | Override: `NEW` / `RUNNING` / `RELIABLE` |

---

## Development Guide

### Project structure

```
src/inspectai/
├── main.py                     # FastAPI app + utility routes
├── config.py                   # Settings from .env
├── api/
│   └── runs.py                 # Run CRUD + background pipeline
├── models/
│   └── schemas.py              # All Pydantic models
├── generators/
│   └── scenario_generator.py   # Scenario creation (maturity-aware)
├── runners/
│   └── test_runner.py          # HTTP runner + rule checks
├── core/
│   ├── judge_pool.py           # LLM judge selection
│   └── demo.py                 # Static demo data
├── analyzers/
│   └── failure_analyzer.py     # HDBSCAN failure clustering
├── fixers/
│   └── fix_recommender.py      # Fix plan generation
└── dashboard/                  # React SPA (no build step)
    ├── index.html
    ├── api.js
    ├── app.jsx
    └── components/
        ├── shared.jsx
        ├── Landing.jsx
        ├── Login.jsx
        ├── TopBar.jsx
        ├── Sidebar.jsx
        ├── Dashboard.jsx
        ├── Issues.jsx
        ├── Remediation.jsx
        ├── Scenarios.jsx
        ├── Integration.jsx
        ├── Reports.jsx
        └── Settings.jsx
```

### Running tests

```bash
uv run pytest
# or:
python -m pytest tests/
```

### Self-test endpoint

```bash
curl http://localhost:8000/self-test
```

Runs a quick internal smoke test against the demo data pipeline.

### Active LLM judges

The judge pool is configured in `src/inspectai/core/judge_pool.py`. Currently enabled:

| Judge | Provider | Notes |
|-------|----------|-------|
| `prometheus-eval/prometheus-bgb-8x7b-v2.0` | Hugging Face | Free — requires `HUGGINGFACE_TOKEN` |
| `gpt-5` | OpenAI | Requires `OPENAI_API_KEY` |
| `claude-sonnet-4-6` | Anthropic | Requires `ANTHROPIC_API_KEY` |

To add or swap judges, edit the `JUDGE_POOL` list in `judge_pool.py`.

---

## Known Limitations & Roadmap

| # | Issue | Status |
|---|-------|--------|
| A | `api_key` → `Authorization` header wiring | ✅ Fixed |
| B | `previous_runs` learning across scans | ✅ Fixed |
| C | `TestRunConfig` weight fields not wired to scenario generator | Pending |
| D | No real multi-tenant auth (any email can sign in) | Pending |
| E | `budget_limit_usd` not surfaced in UI | Pending |
| F | `DifficultyLevel` and `tags` now shown in Scenarios page | ✅ Fixed |
| G | Low default rate limit (10 req/min) | Pending |

---

## License

MIT © InspectAI
