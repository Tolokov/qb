import json
import re
import time
from collections import deque
from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import Settings


class SecurityMiddleware(BaseHTTPMiddleware):
    _rate_store: dict[str, deque[float]] = {}

    def __init__(self, app, settings: Settings):
        super().__init__(app)
        self._settings = settings
        self._compiled_patterns = [re.compile(p, re.I) for p in settings.sql_injection_patterns]

    @staticmethod
    def _check_sql_injection_value(value: Any, compiled_patterns: list[re.Pattern[str]]) -> bool:
        if isinstance(value, str):
            s = value.strip()
            for pat in compiled_patterns:
                if pat.search(s):
                    return True
            return False
        if isinstance(value, dict):
            return any(SecurityMiddleware._check_sql_injection_value(v, compiled_patterns) for v in value.values())
        if isinstance(value, list):
            return any(SecurityMiddleware._check_sql_injection_value(v, compiled_patterns) for v in value)
        return False

    @staticmethod
    def _rate_limit_exceeded(client_host: str, settings: Settings) -> bool:
        now = time.monotonic()
        if client_host not in SecurityMiddleware._rate_store:
            SecurityMiddleware._rate_store[client_host] = deque(maxlen=settings.rate_limit_requests)
        q = SecurityMiddleware._rate_store[client_host]
        while q and q[0] < now - settings.rate_limit_window_sec:
            q.popleft()
        if len(q) >= settings.rate_limit_requests:
            return True
        q.append(now)
        return False

    async def dispatch(self, request: Request, call_next):
        s = self._settings
        if request.url.path != s.security_compile_path or request.method != s.security_compile_method:
            return await call_next(request)

        client = request.client
        client_host = client.host if client else "unknown"
        if self._rate_limit_exceeded(client_host, s):
            return JSONResponse(
                status_code=429,
                content={"detail": "Слишком много запросов. Попробуйте позже."},
            )

        body = await request.body()
        if not body:
            return await call_next(request)

        try:
            data = json.loads(body)
        except Exception:

            async def receive():
                return {"type": "http.request", "body": body, "more_body": False}

            return await call_next(Request(request.scope, receive))

        if self._check_sql_injection_value(data, self._compiled_patterns):
            return JSONResponse(
                status_code=400,
                content={"detail": "Обнаружены недопустимые данные в запросе."},
            )

        async def receive():
            return {"type": "http.request", "body": body, "more_body": False}

        return await call_next(Request(request.scope, receive))
