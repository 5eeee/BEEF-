from uuid import UUID

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.auth import decode_token


PUBLIC_PREFIXES = (
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/metrics",
    "/api/v1/auth",
)


class JWTAuthMiddleware(BaseHTTPMiddleware):
    """Validates JWT on protected routes and sets request.state.user_id."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path == "/" or any(path.startswith(prefix) for prefix in PUBLIC_PREFIXES):
            return await call_next(request)

        if not path.startswith("/api/v1/users"):
            return await call_next(request)

        auth_header = request.headers.get("authorization")
        if not auth_header or not auth_header.lower().startswith("bearer "):
            return JSONResponse(status_code=401, content={"detail": "Not authenticated"})

        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_token(token, expected_type="access")
            request.state.user_id = UUID(payload["sub"])
        except (ValueError, KeyError):
            return JSONResponse(status_code=401, content={"detail": "Invalid token"})

        return await call_next(request)
