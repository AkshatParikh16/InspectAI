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
