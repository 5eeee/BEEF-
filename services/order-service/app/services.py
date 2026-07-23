import json
import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID, uuid4

import aio_pika
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Order, OrderItem, OrderStatus
from app.repositories import CartRepository, CatalogClient, DeliveryClient, PromotionClient
from app.schemas import CartItemCreate, CartResponse, CheckoutRequest, OrderResponse, OrderStatusUpdate

logger = logging.getLogger(__name__)

KITCHEN_STATUS_FLOW = {
    OrderStatus.CONFIRMED: OrderStatus.PREPARING,
    OrderStatus.PAID: OrderStatus.PREPARING,
    OrderStatus.PREPARING: OrderStatus.READY,
    OrderStatus.READY: OrderStatus.DELIVERING,
    OrderStatus.DELIVERING: OrderStatus.COMPLETED,
}

ORDER_CREATED_EVENT = "order.created"
ORDER_STATUS_CHANGED_EVENT = "order.status_changed"


def generate_order_number() -> str:
    """Формат: BS-YYYYMMDD-XXXX"""
    now = datetime.now(timezone.utc)
    suffix = str(uuid4().int)[-4:]
    return f"BS-{now.strftime('%Y%m%d')}-{suffix}"


class OrderService:
    def __init__(
        self,
        db: AsyncSession,
        cart_repo: CartRepository,
        catalog: CatalogClient | None = None,
        promotion: PromotionClient | None = None,
        delivery: DeliveryClient | None = None,
        event_publisher: "EventPublisher | None" = None,
    ):
        self.db = db
        self.cart = cart_repo
        self.catalog = catalog or CatalogClient()
        self.promotion = promotion or PromotionClient()
        self.delivery = delivery or DeliveryClient()
        self.events = event_publisher

    async def get_cart(self, session_id: str) -> CartResponse:
        items = await self.cart.get_cart(session_id)
        return self.cart._to_response(session_id, items)

    async def add_to_cart(self, session_id: str, item: CartItemCreate) -> CartResponse:
        product = await self.catalog.get_product(item.product_id)
        if not product.get("is_available", True):
            raise ValueError("Product is not available")
        return await self.cart.add_item(session_id, item, product)

    async def update_cart_item(self, session_id: str, product_id: UUID, quantity: int) -> CartResponse:
        return await self.cart.set_item_quantity(session_id, product_id, quantity)

    async def remove_from_cart(self, session_id: str, product_id: UUID) -> CartResponse:
        return await self.cart.remove_item(session_id, product_id)

    async def apply_promo(self, session_id: str, promo_code: str, user_id: UUID | None) -> dict:
        cart = await self.get_cart(session_id)
        if not cart.items:
            raise ValueError("Cart is empty")
        promo = await self.promotion.validate_promo(promo_code, cart.subtotal, user_id)
        discount = Decimal(promo["discount"])
        return {
            "promo_code": promo_code.upper(),
            "discount": discount,
            "subtotal": cart.subtotal,
            "total": cart.subtotal - discount,
        }

    async def checkout(
        self,
        session_id: str,
        payload: CheckoutRequest,
        user_id: UUID | None = None,
    ) -> OrderResponse:
        cart = await self.get_cart(session_id)
        if not cart.items:
            raise ValueError("Cart is empty")

        discount = Decimal("0")
        if payload.promo_code:
            promo = await self.promotion.validate_promo(payload.promo_code, cart.subtotal, user_id)
            discount = Decimal(promo["discount"])

        delivery_fee = await self.delivery.calculate_fee(
            payload.delivery_address, payload.delivery_type.value
        )
        total = cart.subtotal + delivery_fee - discount

        order = Order(
            order_number=generate_order_number(),
            user_id=user_id,
            session_id=session_id,
            status=OrderStatus.PENDING_PAYMENT,
            delivery_type=payload.delivery_type.value,
            payment_method=payload.payment_method.value,
            customer_name=payload.customer_name,
            customer_phone=payload.customer_phone,
            delivery_address=payload.delivery_address,
            comment=payload.comment,
            subtotal=cart.subtotal,
            delivery_fee=delivery_fee,
            discount=discount,
            total=total,
            promo_code=payload.promo_code.upper() if payload.promo_code else None,
            estimated_ready_at=datetime.now(timezone.utc) + timedelta(minutes=45),
        )

        for ci in cart.items:
            order.items.append(
                OrderItem(
                    product_id=ci.product_id,
                    product_slug=ci.product_slug,
                    name=ci.name,
                    unit_price=ci.unit_price,
                    quantity=ci.quantity,
                    image_url=ci.image_url,
                )
            )

        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order, ["items"])
        await self.cart.clear(session_id)

        if self.events:
            await self.events.publish(ORDER_CREATED_EVENT, self._order_event_payload(order))

        return self._to_order_response(order)

    async def update_order_status(self, order_id: UUID, payload: OrderStatusUpdate) -> OrderResponse:
        result = await self.db.execute(
            select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        if not order:
            raise ValueError("Order not found")

        old_status = OrderStatus(order.status)
        new_status = payload.status

        if old_status == new_status:
            return self._to_order_response(order)

        allowed_next = KITCHEN_STATUS_FLOW.get(old_status)
        if allowed_next != new_status and not (
            old_status == OrderStatus.READY and new_status == OrderStatus.COMPLETED and order.delivery_type == "pickup"
        ):
            raise ValueError(f"Invalid status transition: {old_status} -> {new_status}")

        order.status = new_status.value
        await self.db.commit()
        await self.db.refresh(order, ["items"])

        if self.events:
            await self.events.publish(
                ORDER_STATUS_CHANGED_EVENT,
                {
                    **self._order_event_payload(order),
                    "old_status": old_status.value,
                    "new_status": new_status.value,
                    "changed_at": datetime.now(timezone.utc).isoformat(),
                },
            )

        return self._to_order_response(order)

    def _order_event_payload(self, order: Order) -> dict:
        return {
            "order_id": str(order.id),
            "order_number": order.order_number,
            "user_id": str(order.user_id) if order.user_id else None,
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone,
            "delivery_address": order.delivery_address,
            "delivery_type": order.delivery_type,
            "subtotal": str(order.subtotal),
            "delivery_fee": str(order.delivery_fee),
            "discount": str(order.discount),
            "total": str(order.total),
            "status": order.status,
            "items": [
                {
                    "product_id": str(i.product_id),
                    "product_slug": i.product_slug,
                    "name": i.name,
                    "unit_price": str(i.unit_price),
                    "quantity": i.quantity,
                    "image_url": i.image_url,
                }
                for i in order.items
            ],
            "created_at": order.created_at.isoformat() if order.created_at else None,
        }

    async def get_order(self, order_id: UUID) -> OrderResponse | None:
        result = await self.db.execute(
            select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        if not order:
            return None
        return self._to_order_response(order)

    async def update_payment_status(self, order_id: UUID, status: OrderStatus) -> Order | None:
        result = await self.db.execute(select(Order).where(Order.id == order_id))
        order = result.scalar_one_or_none()
        if not order:
            return None
        old_status = order.status
        order.status = status.value
        await self.db.commit()
        await self.db.refresh(order)

        if self.events and old_status != status.value:
            await self.events.publish(
                ORDER_STATUS_CHANGED_EVENT,
                {
                    "order_id": str(order.id),
                    "order_number": order.order_number,
                    "old_status": old_status,
                    "new_status": status.value,
                    "changed_at": datetime.now(timezone.utc).isoformat(),
                },
            )

        return order

    async def get_user_orders(self, user_id: UUID, limit: int = 20) -> list[OrderResponse]:
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .limit(limit)
        )
        return [self._to_order_response(o) for o in result.scalars().all()]

    def _to_order_response(self, order: Order) -> OrderResponse:
        items = [
            {
                "product_id": i.product_id,
                "product_slug": i.product_slug,
                "name": i.name,
                "unit_price": i.unit_price,
                "quantity": i.quantity,
                "image_url": i.image_url,
                "line_total": i.unit_price * i.quantity,
            }
            for i in order.items
        ]
        data = {
            "id": order.id,
            "order_number": order.order_number,
            "status": order.status,
            "delivery_type": order.delivery_type,
            "payment_method": order.payment_method,
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone,
            "delivery_address": order.delivery_address,
            "comment": order.comment,
            "subtotal": order.subtotal,
            "delivery_fee": order.delivery_fee,
            "discount": order.discount,
            "total": order.total,
            "promo_code": order.promo_code,
            "estimated_ready_at": order.estimated_ready_at,
            "items": items,
            "created_at": order.created_at,
        }
        return OrderResponse.model_validate(data)


EVENTS_EXCHANGE = "beefshteks.events"


class EventPublisher:
    """Публикация доменных событий в RabbitMQ."""

    def __init__(self, connection: aio_pika.RobustConnection | None = None):
        self._connection = connection

    async def publish(self, routing_key: str, payload: dict) -> None:
        if not self._connection:
            logger.warning("RabbitMQ not connected, skipping event: %s", routing_key)
            return
        channel = await self._connection.channel()
        exchange = await channel.declare_exchange(EVENTS_EXCHANGE, aio_pika.ExchangeType.DIRECT, durable=True)
        await exchange.publish(
            aio_pika.Message(body=json.dumps(payload, default=str).encode(), delivery_mode=aio_pika.DeliveryMode.PERSISTENT),
            routing_key=routing_key,
        )
        await channel.close()
