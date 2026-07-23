"""Shared event schemas and constants for Beefshteks microservices."""

from enum import StrEnum


class EventTopic(StrEnum):
    ORDER_CREATED = "order.created"
    ORDER_CONFIRMED = "order.confirmed"
    ORDER_STATUS_CHANGED = "order.status_changed"
    PAYMENT_COMPLETED = "payment.completed"
    PAYMENT_FAILED = "payment.failed"
    USER_REGISTERED = "user.registered"
    REVIEW_REQUESTED = "review.requested"


class OrderStatus(StrEnum):
    DRAFT = "draft"
    PENDING_PAYMENT = "pending_payment"
    PAID = "paid"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    DELIVERING = "delivering"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DeliveryType(StrEnum):
    DELIVERY = "delivery"
    PICKUP = "pickup"


class PaymentMethod(StrEnum):
    CARD = "card"
    APPLE_PAY = "apple_pay"
    GOOGLE_PAY = "google_pay"
    SBER_PAY = "sber_pay"
