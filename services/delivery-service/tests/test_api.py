"""Delivery service tests."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.geocoding import suggest_address
from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["service"] == "delivery-service"


@pytest.mark.asyncio
async def test_suggest_mock_without_api_key():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/delivery/geocode/suggest",
            json={"query": "москва"},
        )
    assert res.status_code == 200
    data = res.json()
    assert "suggestions" in data
    assert len(data["suggestions"]) > 0


@pytest.mark.asyncio
async def test_suggest_short_query():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/delivery/geocode/suggest",
            json={"query": "м"},
        )
    assert res.status_code == 200
    assert res.json()["suggestions"] == []


@pytest.mark.asyncio
async def test_calculate_delivery_fee():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/delivery/calculate",
            json={"address": "г Москва, ул Тверская, д 1"},
        )
    assert res.status_code == 200
    data = res.json()
    assert data["fee"] == "199.00"
    assert data["eta_minutes"] == 45


@pytest.mark.asyncio
async def test_suggest_uses_redis_cache(monkeypatch):
    redis = AsyncMock()
    redis.get = AsyncMock(return_value=json.dumps(["cached address"]))
    redis.setex = AsyncMock()

    monkeypatch.setattr("app.config.settings.dadata_api_key", "")

    result = await suggest_address(redis, "москва")
    assert result == ["cached address"]
    redis.get.assert_awaited_once()
    redis.setex.assert_not_awaited()


@pytest.mark.asyncio
async def test_suggest_dadata_when_key_set(monkeypatch):
    redis = AsyncMock()
    redis.get = AsyncMock(return_value=None)
    redis.setex = AsyncMock()

    monkeypatch.setattr("app.config.settings.dadata_api_key", "test-key")

    with patch("app.geocoding._fetch_dadata", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = ["г Москва, ул Тверская, д 1"]
        result = await suggest_address(redis, "тверская")

    assert result == ["г Москва, ул Тверская, д 1"]
    mock_fetch.assert_awaited_once_with("тверская")
    redis.setex.assert_awaited_once()


@pytest.mark.asyncio
async def test_suggest_falls_back_to_mock_on_dadata_error(monkeypatch):
    redis = AsyncMock()
    redis.get = AsyncMock(return_value=None)
    redis.setex = AsyncMock()

    monkeypatch.setattr("app.config.settings.dadata_api_key", "test-key")

    with patch("app.geocoding._fetch_dadata", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.side_effect = RuntimeError("network error")
        result = await suggest_address(redis, "арбат")

    assert len(result) > 0
