"""
In-memory rate limiting for concurrency protection.
Limits requests per client IP by path prefix (auth stricter than general API).
"""
import os
import time
import logging
from collections import defaultdict
from threading import Lock

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger("applyai.ratelimit")

# Config via env (requests per window per IP)
AUTH_LIMIT = int(os.environ.get("RATE_LIMIT_AUTH", "10"))   # login/signup per minute
API_LIMIT = int(os.environ.get("RATE_LIMIT_API", "120"))    # general API per minute
AI_LIMIT = int(os.environ.get("RATE_LIMIT_AI", "30"))       # AI endpoints per minute
WINDOW_SEC = 60

# In-memory: key -> list of request timestamps (pruned to last WINDOW_SEC)
_store: dict[str, list[float]] = defaultdict(list)
_lock = Lock()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host or "unknown"
    return "unknown"


def _key(ip: str, path: str) -> str:
    return f"{ip}:{path}"


def _prune(now: float, timestamps: list[float]) -> None:
    cutoff = now - WINDOW_SEC
    while timestamps and timestamps[0] < cutoff:
        timestamps.pop(0)


def _is_allowed(key: str, limit: int) -> bool:
    now = time.time()
    with _lock:
        timestamps = _store[key]
        _prune(now, timestamps)
        if len(timestamps) >= limit:
            return False
        timestamps.append(now)
    return True


def _path_category(path: str) -> str:
    if path.startswith("/api/auth/signup") or path.startswith("/api/auth/login"):
        return "auth"
    if path.startswith("/api/auth/google"):
        return "auth"
    if path.startswith("/api/auth/"):
        return "auth_other"
    if any(
        path.startswith(p)
        for p in (
            "/api/tailor-resume",
            "/api/score-resume",
            "/api/generate-cover-letter",
            "/api/generate-followups",
            "/api/interview-prep",
            "/api/extract-candidate-info",
        )
    ):
        return "ai"
    if path.startswith("/api/"):
        return "api"
    return "other"


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method not in ("POST", "PATCH", "PUT"):
            return await call_next(request)

        path = request.url.path
        category = _path_category(path)
        ip = _client_ip(request)

        if category == "other":
            return await call_next(request)

        if category == "auth":
            limit = AUTH_LIMIT
            key = _key(ip, "auth")
        elif category == "ai":
            limit = AI_LIMIT
            key = _key(ip, "ai")
        else:
            limit = API_LIMIT
            key = _key(ip, "api")

        if not _is_allowed(key, limit):
            logger.warning(f"rate_limit | 429 | ip={ip} | path={path} | category={category}")
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please slow down and try again in a minute.",
                },
            )

        return await call_next(request)
