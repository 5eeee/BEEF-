import json
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock
from uuid import uuid4

import aio_pika
import pytest

from app.models import DeliveryType, Order, OrderStatus, PaymentMethod
from app.schemas import OrderStatusUpdate
from app.services import EVENTS_EXCHANGE, EventPublisher, OrderService


def _make_order(**overrides):
    order = Order(
        id=uuid4(),
        order_number="BS-20260721-0001",
        user_id=uuid4(),
        session_id="session-12345678",
        status=OrderStatus.CONFIRMED,
        delivery_type=DeliveryType.DELIVERY,
        payment_method=PaymentMethod.CARD,
        customer_name="Test User",
        customer_phone="+79991234567",
        delivery_address="Moscow",
        subtotal=Decimal("500.00"),
        delivery_fee=Decimal("150.00"),
        discount=Decimal("0.00"),
        total=Decimal("650.00"),
        created_at=datetime.now(timezone.utc),
    )
    order.items = []
    for key, value in overrides.items():
        setattr(order, key, value)
    return order


@pytest.mark.asyncio
async def test_event_publisher_uses_shared_exchange():
    channel = AsyncMock()
    exchange = AsyncMock()
    channel.declare_exchange = AsyncMock(return_value=exchange)
    connection = AsyncMock()
    connection.channel = AsyncMock(return_value=channel)

    publisher = EventPublisher(connection)
    await publisher.publish("order.created", {"order_id": "abc", "order_number": "BS-1"})

    channel.declare_exchange.assert_awaited_once_with(
        EVENTS_EXCHANGE, aio_pika.ExchangeType.DIRECT, durable=True
    )
    exchange.publish.assert_awaited_once()
    message = exchange.publish.await_args.args[0]
    body = json.loads(message.body.decode())
    assert body["order_number"] == "BS-1"


@pytest.mark.asyncio
async def test_order_event_payload_includes_phone_and_number():
    order = _make_order()
    service = OrderService(AsyncMock(), AsyncMock())
    payload = service._order_event_payload(order)
    assert payload["order_number"] == order.order_number
    assert payload["customer_phone"] == order.customer_phone


@pytest.mark.asyncio
async def test_update_order_status_valid_transition():
    publisher = AsyncMock(spec=EventPublisher)
    db = AsyncMock()
    order = _make_order(status=OrderStatus.CONFIRMED)

    class Result:
        def scalar_one_or_none(self):
            return order

    db.execute = AsyncMock(return_value=Result())
    db.commit = AsyncMock()
    db.refresh = AsyncMock()

    service = OrderService(db, AsyncMock(), event_publisher=publisher)
    updated = await service.update_order_status(order.id, OrderStatusUpdate(status=OrderStatus.PREPARING))

    assert updated.status == OrderStatus.PREPARING
    publisher.publish.assert_awaited_once()
    assert publisher.publish.await_args.args[0] == "order.status_changed"


@pytest.mark.asyncio
async def test_update_order_status_invalid_transition():
    service = OrderService(AsyncMock(), AsyncMock())
    order = _make_order(status=OrderStatus.PENDING_PAYMENT)

    class Result:
        def scalar_one_or_none(self):
            return order

    service.db.execute = AsyncMock(return_value=Result())

    with pytest.raises(ValueError, match="Invalid status transition"):
        await service.update_order_status(order.id, OrderStatusUpdate(status=OrderStatus.READY))
