"""Promotion Service — промокоды и акции."""

from decimal import Decimal
from uuid import UUID

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.admin_routes import router as admin_router

app = FastAPI(title="Promotion Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_router)

PROMO_CODES = {
    "WELCOME10": {"type": "percent", "value": Decimal("10")},
    "BEEF200": {"type": "fixed", "value": Decimal("200")},
}

ACTIVE_CAMPAIGNS = [
    {
        "title": "Скидка 10% на первый заказ",
        "description": "Промокод WELCOME10 при оформлении заказа",
        "code": "WELCOME10",
    },
    {
        "title": "200 ₽ на заказ от 1500 ₽",
        "description": "Промокод BEEF200 — фиксированная скидка",
        "code": "BEEF200",
    },
]


class ValidateRequest(BaseModel):
    code: str
    subtotal: str
    user_id: str | None = None


class ValidateResponse(BaseModel):
    discount: Decimal
    code: str


class CampaignResponse(BaseModel):
    title: str
    description: str
    code: str


@app.get("/health")
async def health():
    return {"status": "ok", "service": "promotion-service"}


@app.get("/api/v1/promo/active", response_model=list[CampaignResponse])
async def active_promos():
    return [CampaignResponse(**c) for c in ACTIVE_CAMPAIGNS]


@app.post("/api/v1/promo/validate", response_model=ValidateResponse)
async def validate_promo(body: ValidateRequest):
    code = body.code.upper()
    subtotal = Decimal(body.subtotal)
    promo = PROMO_CODES.get(code)
    if not promo:
        raise HTTPException(status_code=400, detail="Invalid promo code")

    if promo["type"] == "percent":
        discount = (subtotal * promo["value"] / Decimal("100")).quantize(Decimal("0.01"))
    else:
        if subtotal < Decimal("1500"):
            raise HTTPException(status_code=400, detail="Minimum order amount is 1500 for this promo")
        discount = min(promo["value"], subtotal)

    return ValidateResponse(discount=discount, code=code)
