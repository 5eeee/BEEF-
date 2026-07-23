from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import SyncLogResponse
from app.services import IntegrationService

router = APIRouter(prefix="/api/v1/integration", tags=["integration"])


@router.get("/sync-logs", response_model=list[SyncLogResponse])
async def list_sync_logs(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    service = IntegrationService(db)
    logs = await service.list_sync_logs(limit=limit)
    return logs
