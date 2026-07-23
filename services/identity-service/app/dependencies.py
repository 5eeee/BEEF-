from uuid import UUID

import redis.asyncio as aioredis
from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth import decode_token
from app.services import AuthService


async def get_redis(request: Request) -> aioredis.Redis:
    redis = getattr(request.app.state, "redis", None)
    if redis is None:
        raise HTTPException(status_code=503, detail="Redis unavailable")
    return redis


def _extract_bearer(authorization: str | None) -> str | None:
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1]


async def get_current_user_id(
    request: Request,
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> UUID:
    user_id: UUID | None = getattr(request.state, "user_id", None)

    if not user_id:
        token = _extract_bearer(authorization)
        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        try:
            payload = decode_token(token, expected_type="access")
            user_id = UUID(payload["sub"])
        except (ValueError, KeyError) as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    auth = AuthService(db)
    user = await auth.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    request.state.user_id = user_id
    return user_id
