"""Resolve media-service URLs for catalog images."""

from app.config import settings


def media_file_url(asset_id: str) -> str:
    base = settings.public_api_url.rstrip("/")
    return f"{base}/api/v1/media/{asset_id}/file"


def is_media_service_url(url: str) -> bool:
    return "/api/v1/media/" in url
