import time
from collections import defaultdict

from fastapi import HTTPException, Request, Security
from fastapi.security import APIKeyHeader
from slowapi import Limiter
from slowapi.util import get_remote_address

from inspectai.config import settings
from inspectai.core.logging import get_logger

logger = get_logger(__name__)

limiter = Limiter(key_func=get_remote_address)

_stats: dict[str, int] = defaultdict(int)

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(_api_key_header)) -> str:
    if not settings.api_key or api_key == settings.api_key:
        return api_key or ""
    raise HTTPException(status_code=403, detail="Invalid or missing API key")


async def logging_middleware(request: Request, call_next):
    _stats["requests_total"] += 1
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "request",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        response_time_ms=duration_ms,
    )
    return response
