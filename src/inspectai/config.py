from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    anthropic_api_key: str = ""
    openai_api_key: str = ""
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_host: str = "https://cloud.langfuse.com"
    default_model: str = "claude-sonnet-4-20250514"
    database_path: str = "./data/InspectAI.duckdb"
    environment: str = "development"
    api_key: str = ""
    log_level: str = "INFO"
    max_concurrent_tests: int = 10
    llm_timeout_seconds: int = 30
    rate_limit_per_minute: int = 10


settings = Settings()
