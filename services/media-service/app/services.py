import asyncio
import io
import logging
import uuid
from uuid import UUID

from fastapi import HTTPException, UploadFile
from PIL import Image
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import MediaAsset
from app.schemas import MediaAssetResponse
from app.storage import download_bytes, object_key, upload_bytes

logger = logging.getLogger(__name__)


def _public_url(asset_id: uuid.UUID) -> str:
    base = settings.public_base_url.rstrip("/")
    return f"{base}/api/v1/media/{asset_id}/file"


async def convert_to_webp(data: bytes, *, quality: int | None = None) -> bytes:
    def _convert() -> bytes:
        with Image.open(io.BytesIO(data)) as img:
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGBA")
                background = Image.new("RGB", img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])
                img = background
            elif img.mode != "RGB":
                img = img.convert("RGB")
            out = io.BytesIO()
            img.save(out, format="WEBP", quality=quality or settings.webp_quality, method=6)
            return out.getvalue()

    return await asyncio.to_thread(_convert)


class MediaService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upload(self, file: UploadFile) -> MediaAssetResponse:
        raw = await file.read()
        if not raw:
            raise HTTPException(status_code=400, detail="Empty file")
        if len(raw) > settings.max_upload_bytes:
            raise HTTPException(status_code=413, detail="File too large")

        webp_data = await convert_to_webp(raw)
        asset_id = uuid.uuid4()
        filename = file.filename or f"{asset_id}.webp"
        if not filename.lower().endswith(".webp"):
            stem = filename.rsplit(".", 1)[0] if "." in filename else filename
            filename = f"{stem}.webp"

        key = object_key(str(asset_id))
        await asyncio.to_thread(upload_bytes, key, webp_data, "image/webp")

        asset = MediaAsset(
            id=asset_id,
            filename=filename,
            url=_public_url(asset_id),
            mime="image/webp",
            size=len(webp_data),
        )
        self.db.add(asset)
        await self.db.commit()
        await self.db.refresh(asset)
        return MediaAssetResponse.model_validate(asset)

    async def get_asset(self, asset_id: UUID) -> MediaAssetResponse | None:
        result = await self.db.execute(select(MediaAsset).where(MediaAsset.id == asset_id))
        asset = result.scalar_one_or_none()
        if not asset:
            return None
        return MediaAssetResponse.model_validate(asset)

    async def get_file(self, asset_id: UUID) -> tuple[bytes, str]:
        result = await self.db.execute(select(MediaAsset).where(MediaAsset.id == asset_id))
        asset = result.scalar_one_or_none()
        if not asset:
            raise HTTPException(status_code=404, detail="Media asset not found")

        try:
            data, content_type = await asyncio.to_thread(download_bytes, object_key(str(asset_id)))
        except Exception as exc:
            logger.exception("Failed to download asset %s", asset_id)
            raise HTTPException(status_code=404, detail="Media file not found") from exc

        return data, content_type or asset.mime
