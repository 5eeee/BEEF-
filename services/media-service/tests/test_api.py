import io

import pytest

from app.services import convert_to_webp


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_convert_to_webp_from_png():
    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (32, 32), color=(255, 0, 0)).save(buf, format="PNG")
    webp = await convert_to_webp(buf.getvalue())
    assert isinstance(webp, bytes)
    assert len(webp) > 0
    assert webp[:4] == b"RIFF"


@pytest.mark.anyio
async def test_health_endpoint():
    from httpx import ASGITransport, AsyncClient

    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "media-service"
