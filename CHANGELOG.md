# Changelog

All notable changes to InspectAI will be documented in this file.

## [0.1.0] - 2026-05-10

### Added
- Initial project setup with FastAPI application skeleton
- Pydantic schemas: `Scenario`, `TestResult`, `TestRun`, `FixRecommendation`
- Enums: `SystemType`, `FailureType`, `DifficultyLevel`, `Priority`
- Configuration models: `SystemConfig`, `CustomerSupportConfig`, `RAGConfig`, `MultiAgentConfig` with nested configs
- Structured logging via structlog (JSON in production, console in development)
- Custom exception hierarchy: `InspectAIError`, `LLMCallError`, `DatabaseError`, `ValidationError`, `TimeoutError`, `RateLimitError`
- Request/response logging middleware with method, path, status code, and response time
- API key authentication dependency
- Rate limiting via slowapi
- `/health` endpoint with database connectivity check
- `/metrics` endpoint with basic usage stats
- Graceful startup and shutdown via FastAPI lifespan handler
- DuckDB integration for persistent storage

### Production readiness (7 fixes)
- **Fix 1** — `ExampleConversation` model; `example_conversations` on `CustomerSupportConfig`, `RAGConfig`, `MultiAgentConfig`; `example_conversations` and `example_count` on `SystemConfig`
- **Fix 2** — `JudgeCalibration` model (Cohen's κ, TPR, TNR, label count); attached to `TestResult`
- **Fix 3** — `TestRunConfig` model; `dry_run`, `is_production_target`, `staging_warning_acknowledged` fields on `TestRun`
- **Fix 4** — `CostEstimate` model; `estimated_cost`, `actual_cost_usd`, `total_tokens_used` fields on `TestRun`
- **Fix 5** — `TestRunTrend` model for cross-run improvement tracking
- **Fix 6** — `DemoMode` class with ShopEasy config, 20 pre-seeded scenarios, mock results; `GET /demo` endpoint
- **Fix 7** — `SelfTest` class and `SelfTestResult` model; `GET /self-test` endpoint
