import os

import jwt
from fastapi import Header, HTTPException, status

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


def verify_admin(
    x_admin_token: str | None = Header(None, alias="X-Admin-Token"),
    authorization: str | None = Header(None),
) -> None:
    if x_admin_token and x_admin_token == ADMIN_PASSWORD:
        return

    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get("role") == "admin":
                return
        except jwt.PyJWTError:
            pass

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin authentication required")
