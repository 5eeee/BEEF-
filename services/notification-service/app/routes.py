from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import PushSubscribeRequest, PushSubscribeResponse
from app.services import NotificationService

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


@router.post("/push/subscribe", response_model=PushSubscribeResponse, status_code=201)
async def subscribe_push(
    body: PushSubscribeRequest,
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    sub = await service.subscribe_push(body.model_dump())
    return PushSubscribeResponse(id=sub.id, endpoint=sub.endpoint, created_at=sub.created_at)
