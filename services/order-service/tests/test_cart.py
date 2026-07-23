import pytest
from decimal import Decimal
from uuid import uuid4

from app.repositories import CartRepository


class FakeRedis:
    def __init__(self):
        self.store = {}

    async def get(self, key):
        return self.store.get(key)

    async def setex(self, key, ttl, value):
        self.store[key] = value

    async def delete(self, key):
        self.store.pop(key, None)


@pytest.mark.asyncio
async def test_cart_add_and_totals():
    redis = FakeRedis()
    repo = CartRepository(redis)
    session_id = "test-session-12345678"
    product_id = uuid4()

    product = {
        "slug": "big-burger",
        "name": "Big Burger",
        "price": "450.00",
        "image_url": "https://cdn.example/burger.webp",
    }

    from app.schemas import CartItemCreate

    cart = await repo.add_item(session_id, CartItemCreate(product_id=product_id, quantity=2), product)
    assert cart.item_count == 2
    assert cart.subtotal == Decimal("900.00")
    assert len(cart.items) == 1


@pytest.mark.asyncio
async def test_cart_remove_item():
    redis = FakeRedis()
    repo = CartRepository(redis)
    session_id = "test-session-87654321"
    product_id = uuid4()

    product = {"slug": "cola", "name": "Cola", "price": "120.00"}
    from app.schemas import CartItemCreate

    await repo.add_item(session_id, CartItemCreate(product_id=product_id, quantity=1), product)
    cart = await repo.remove_item(session_id, product_id)
    assert cart.item_count == 0
    assert cart.subtotal == Decimal("0")
