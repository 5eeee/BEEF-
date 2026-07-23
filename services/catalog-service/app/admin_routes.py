import asyncio

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.schemas import CatalogImportRequest, CatalogImportResponse
from app.seed import sync_search_index
from app.services import CatalogService

router = APIRouter(prefix="/api/v1/admin")


async def get_catalog_service(db: AsyncSession = Depends(get_db)) -> CatalogService:
    return CatalogService(db, public_api_url=settings.public_api_url)


def verify_admin_key(x_admin_key: str | None = Header(default=None)) -> None:
    if not x_admin_key or x_admin_key != settings.admin_import_key:
        raise HTTPException(status_code=401, detail="Invalid admin key")


@router.post("/catalog/import", response_model=CatalogImportResponse)
async def import_catalog(
    payload: CatalogImportRequest,
    _: None = Depends(verify_admin_key),
    service: CatalogService = Depends(get_catalog_service),
):
    result = await service.import_catalog(payload)
    try:
        await asyncio.to_thread(sync_search_index)
    except Exception:
        pass
    return result
