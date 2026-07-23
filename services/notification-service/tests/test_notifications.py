import uuid
from unittest.mock import AsyncMock

import pytest

from app.services import NotificationService


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
async def test_render_template_replaces_placeholders():
    body = NotificationService._render_template("Order #{order_number} total {total}", {"order_number": "BS-1", "total": "500"})
    assert body == "Order #BS-1 total 500"


@pytest.mark.asyncio
async def test_handle_order_created_logs_sms():
    db = AsyncMock()
    db.execute = AsyncMock(return_value=FakeResult(value=None))
    service = NotificationService(db)

    await service.handle_order_created(
        {
            "order_id": str(uuid.uuid4()),
            "order_number": "BS-20260721-1234",
            "customer_phone": "+79991234567",
            "total": "990.00",
        }
    )

    db.add.assert_called()
    db.commit.assert_awaited()


@pytest.mark.asyncio
async def test_subscribe_push_creates_subscription():
    db = AsyncMock()
    db.execute = AsyncMock(return_value=FakeResult(value=None))
    db.refresh = AsyncMock()

    service = NotificationService(db)
    payload = {
        "endpoint": "https://push.example/sub/1",
        "p256dh_key": "key",
        "auth_key": "auth",
        "user_id": uuid.uuid4(),
    }
    sub = await service.subscribe_push(payload)

    assert sub.endpoint == payload["endpoint"]
    db.add.assert_called_once()
    db.commit.assert_awaited()
