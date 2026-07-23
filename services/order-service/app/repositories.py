import json
import logging
from decimal import Decimal
from uuid import UUID

import httpx
import redis.asyncio as aioredis

from app.config import settings
from app.schemas import CartItemCreate, CartItemResponse, CartResponse

logger = logging.getLogger(__name__)


class CartRepository:
    """Корзина в Redis — быстрый доступ, TTL 24ч."""

    def __init__(self, redis: aioredis.Redis):
        self.redis = redis
        self.ttl = settings.cart_ttl_seconds

    def _key(self, session_id: str) -> str:
        return f"cart:{session_id}"

    async def get_cart(self, session_id: str) -> list[dict]:
        raw = await self.redis.get(self._key(session_id))
        if not raw:
            return []
        return json.loads(raw)

    async def save_cart(self, session_id: str, items: list[dict]) -> None:
        key = self._key(session_id)
        if items:
            await self.redis.setex(key, self.ttl, json.dumps(items, default=str))
        else:
            await self.redis.delete(key)

    async def add_item(self, session_id: str, item: CartItemCreate, product: dict) -> CartResponse:
        items = await self.get_cart(session_id)
        existing = next((i for i in items if i["product_id"] == str(item.product_id)), None)

        if existing:
            existing["quantity"] += item.quantity
        else:
            items.append(
                {
                    "product_id": str(item.product_id),
                    "product_slug": product["slug"],
                    "name": product["name"],
                    "unit_price": str(product["price"]),
                    "quantity": item.quantity,
                    "image_url": product.get("image_url"),
                }
            )

        await self.save_cart(session_id, items)
        return self._to_response(session_id, items)

    async def update_item(self, session_id: str, product_id: UUID, quantity: int) -> CartResponse:
        items = await self.get_cart(session_id)
        items = [i for i in items if i["product_id"] != str(product_id)]
        if quantity > 0:
            # Re-fetch would be needed; for update we keep existing metadata
            raise ValueError("Use add with delta or full cart replace")
        await self.save_cart(session_id, items)
        return self._to_response(session_id, items)

    async def set_item_quantity(
        self, session_id: str, product_id: UUID, quantity: int
    ) -> CartResponse:
        items = await self.get_cart(session_id)
        if quantity == 0:
            items = [i for i in items if i["product_id"] != str(product_id)]
        else:
            for item in items:
                if item["product_id"] == str(product_id):
                    item["quantity"] = quantity
                    break
        await self.save_cart(session_id, items)
        return self._to_response(session_id, items)

    async def remove_item(self, session_id: str, product_id: UUID) -> CartResponse:
        items = await self.get_cart(session_id)
        items = [i for i in items if i["product_id"] != str(product_id)]
        await self.save_cart(session_id, items)
        return self._to_response(session_id, items)

    async def clear(self, session_id: str) -> None:
        await self.redis.delete(self._key(session_id))

    def _to_response(self, session_id: str, items: list[dict]) -> CartResponse:
        cart_items = []
        subtotal = Decimal("0")
        count = 0
        for i in items:
            price = Decimal(i["unit_price"])
            qty = i["quantity"]
            line = price * qty
            subtotal += line
            count += qty
            cart_items.append(
                CartItemResponse(
                    product_id=UUID(i["product_id"]),
                    product_slug=i["product_slug"],
                    name=i["name"],
                    unit_price=price,
                    quantity=qty,
                    image_url=i.get("image_url"),
                    line_total=line,
                )
            )
        return CartResponse(session_id=session_id, items=cart_items, subtotal=subtotal, item_count=count)


class CatalogClient:
    """Синхронный REST-вызов catalog-service."""

    async def get_product(self, product_id: UUID) -> dict:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.catalog_service_url}/api/v1/products/{product_id}")
            resp.raise_for_status()
            return resp.json()


class PromotionClient:
    async def validate_promo(self, code: str, subtotal: Decimal, user_id: UUID | None) -> dict:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{settings.promotion_service_url}/api/v1/promo/validate",
                json={"code": code, "subtotal": str(subtotal), "user_id": str(user_id) if user_id else None},
            )
            resp.raise_for_status()
            return resp.json()


class DeliveryClient:
    async def calculate_fee(self, address: str | None, delivery_type: str) -> Decimal:
        if delivery_type == "pickup":
            return Decimal("0")
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{settings.delivery_service_url}/api/v1/delivery/calculate",
                json={"address": address},
            )
            resp.raise_for_status()
            data = resp.json()
            return Decimal(data["fee"])
