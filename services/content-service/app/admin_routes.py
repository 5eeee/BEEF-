"""Admin reviews moderation stubs."""

import os
from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")


def verify_admin(x_admin_token: str | None = Header(None, alias="X-Admin-Token")):
    if x_admin_token != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Admin authentication required")


MOCK_REVIEWS = [
    {
        "id": str(uuid4()),
        "author": "Алексей",
        "rating": 5,
        "text": "Отличные бургеры, быстрая доставка!",
        "status": "pending",
        "created_at": datetime.now(UTC).isoformat(),
    },
    {
        "id": str(uuid4()),
        "author": "Мария",
        "rating": 4,
        "text": "Вкусно, но ждали чуть дольше обещанного.",
        "status": "approved",
        "created_at": datetime.now(UTC).isoformat(),
    },
]


class ReviewAdmin(BaseModel):
    id: str
    author: str
    rating: int
    text: str
    status: str
    created_at: str


class ReviewStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|approved|rejected)$")


@router.get("/reviews", response_model=list[ReviewAdmin])
async def list_reviews(
    _: None = Depends(verify_admin),
    status: str | None = None,
):
    reviews = MOCK_REVIEWS
    if status:
        reviews = [r for r in reviews if r["status"] == status]
    return [ReviewAdmin(**r) for r in reviews]


@router.patch("/reviews/{review_id}", response_model=ReviewAdmin)
async def moderate_review(
    review_id: str,
    body: ReviewStatusUpdate,
    _: None = Depends(verify_admin),
):
    for review in MOCK_REVIEWS:
        if review["id"] == review_id:
            review["status"] = body.status
            return ReviewAdmin(**review)
    raise HTTPException(status_code=404, detail="Review not found")
