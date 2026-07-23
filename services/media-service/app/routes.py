from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import MediaAssetResponse
from app.services import MediaService

router = APIRouter(prefix="/api/v1")


async def get_media_service(db: AsyncSession = Depends(get_db)) -> MediaService:
    return MediaService(db)


@router.post("/media/upload", response_model=MediaAssetResponse, status_code=201)
async def upload_media(
    file: UploadFile = File(...),
    service: MediaService = Depends(get_media_service),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported")
    return await service.upload(file)


@router.get("/media/{asset_id}", response_model=MediaAssetResponse)
async def get_media(asset_id: UUID, service: MediaService = Depends(get_media_service)):
    asset = await service.get_asset(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Media asset not found")
    return asset


@router.get("/media/{asset_id}/file")
async def get_media_file(asset_id: UUID, service: MediaService = Depends(get_media_service)):
    data, content_type = await service.get_file(asset_id)
    return Response(content=data, media_type=content_type, headers={"Cache-Control": "public, max-age=86400"})
