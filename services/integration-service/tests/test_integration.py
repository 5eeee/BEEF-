import uuid
from unittest.mock import AsyncMock

import pytest

from app.models import SyncStatus
from app.services import CrmSyncError, IntegrationService


class FakeResult:
    def __init__(self, value=None, values=None):
        self._value = value
        self._values = values or []

    def scalar_one_or_none(self):
        return self._value

    def scalars(self):
        return self

    def all(self):
        return self._values


@pytest.mark.asyncio
async def test_crm_sync_success(monkeypatch):
    db = AsyncMock()
    db.execute = AsyncMock(return_value=FakeResult(value=None))
    db.refresh = AsyncMock()
    service = IntegrationService(db)

    order_id = uuid.uuid4()
    sync_log = await service.sync_order_to_crm(
        "order.created",
        {"order_id": str(order_id), "order_number": "BS-20260721-9999"},
    )

    assert sync_log.status == SyncStatus.SUCCESS
    assert sync_log.attempt_count == 1
    assert db.add.called


@pytest.mark.asyncio
async def test_crm_sync_retries_with_backoff(monkeypatch):
    db = AsyncMock()
    db.execute = AsyncMock(return_value=FakeResult(value=None))
    db.refresh = AsyncMock()
    service = IntegrationService(db)

    sleeps: list[float] = []

    async def fake_sleep(delay: float) -> None:
        sleeps.append(delay)

    attempts = {"count": 0}

    async def flaky_push(payload, attempt):
        attempts["count"] += 1
        if attempt < 2:
            raise CrmSyncError("temporary failure")
        return {"crm_order_id": "CRM-OK", "order_number": payload.get("order_number")}

    monkeypatch.setattr("app.services.asyncio.sleep", fake_sleep)
    monkeypatch.setattr(service, "_mock_crm_push", flaky_push)

    order_id = uuid.uuid4()
    sync_log = await service.sync_order_to_crm(
        "order.created",
        {"order_id": str(order_id), "order_number": "BS-RETRY"},
    )

    assert sync_log.status == SyncStatus.SUCCESS
    assert sync_log.attempt_count == 2
    assert sleeps == [1.0]
