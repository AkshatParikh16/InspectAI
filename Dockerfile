FROM python:3.12-slim

WORKDIR /app

# Install system dependencies needed by hdbscan, lxml, etc.
RUN apt-get update && apt-get install -y \
    gcc g++ build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./

# Extract and install dependencies via pip
RUN pip install --upgrade pip && \
    pip install \
    "fastapi>=0.115.0" \
    "uvicorn[standard]>=0.34.0" \
    "litellm>=1.55.0" \
    "pydantic>=2.10.0" \
    "pydantic-settings>=2.7.0" \
    "duckdb>=1.2.0" \
    "httpx>=0.28.0" \
    "python-dotenv>=1.0.0" \
    "structlog>=24.0.0" \
    "slowapi>=0.1.9" \
    "numpy>=1.26.0" \
    "scikit-learn>=1.4.0" \
    "beautifulsoup4>=4.12.0" \
    "reportlab>=4.2.0" \
    "lxml>=5.0.0" \
    "aiofiles>=23.0.0" \
    "hdbscan>=0.8.0" \
    "sentence-transformers>=3.0.0" \
    "langgraph>=0.2.0" \
    "langfuse>=2.56.0" \
    "polars>=1.20.0"

COPY src/ ./src/

ENV PYTHONPATH=/app/src

EXPOSE 8000

CMD ["uvicorn", "inspectai.main:app", "--host", "0.0.0.0", "--port", "8000"]
