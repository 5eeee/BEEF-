"""Order payment callback tests."""

import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from app.models import Order, OrderStatus
from app.services import OrderService


@pytest.mark.asyncio
async def test_update_payment_status_to_paid():
    db = AsyncMock()
    order = Order(
        id=uuid4(),
        order_number="BS-20260721-1234",
        status=OrderStatus.PENDING_PAYMENT.value,
        delivery_type="delivery",
        customer_name="Test User",
        customer_phone="+79991234567",
        subtotal=Decimal("500.00"),
        delivery_fee=Decimal("100.00"),
        discount=Decimal("0"),
        total=Decimal("600.00"),
    )
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = order
    db.execute.return_value = result_mock
    db.commit = AsyncMock()
    db.refresh = AsyncMock()

    service = OrderService(db, cart_repo=MagicMock())
    updated = await service.update_payment_status(order.id, OrderStatus.PAID)

    assert updated is not None
    assert updated.status == OrderStatus.PAID.value
    db.commit.assert_awaited_once()
