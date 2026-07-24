"""Admin promo management stubs."""

import os
from decimal import Decimal

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")


def verify_admin(x_admin_token: str | None = Header(None, alias="X-Admin-Token")):
    if x_admin_token != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Admin authentication required")


PROMO_CODES: dict[str, dict] = {
    "WELCOME10": {"type": "percent", "value": Decimal("10"), "active": True},
    "BEEF200": {"type": "fixed", "value": Decimal("200"), "active": True},
    "SMASH15": {"type": "percent", "value": Decimal("15"), "active": True},
    "COMBO2": {"type": "percent", "value": Decimal("20"), "active": True},
    "SPICY10": {"type": "percent", "value": Decimal("10"), "active": True},
    "DOUBLE20": {"type": "percent", "value": Decimal("20"), "active": True},
}


class PromoCodeAdmin(BaseModel):
    code: str
    type: str
    value: str
    active: bool


class PromoCodeCreate(BaseModel):
    code: str = Field(..., min_length=3, max_length=32)
    type: str = Field(..., pattern="^(percent|fixed)$")
    value: Decimal = Field(..., gt=0)
    active: bool = True


class PromoCodeUpdate(BaseModel):
    type: str | None = Field(None, pattern="^(percent|fixed)$")
    value: Decimal | None = Field(None, gt=0)
    active: bool | None = None


@router.get("/promo", response_model=list[PromoCodeAdmin])
async def list_promo_codes(_: None = Depends(verify_admin)):
    return [
        PromoCodeAdmin(code=code, type=p["type"], value=str(p["value"]), active=p.get("active", True))
        for code, p in PROMO_CODES.items()
    ]


@router.post("/promo", response_model=PromoCodeAdmin, status_code=201)
async def create_promo_code(body: PromoCodeCreate, _: None = Depends(verify_admin)):
    code = body.code.upper()
    if code in PROMO_CODES:
        raise HTTPException(status_code=409, detail="Promo code already exists")
    PROMO_CODES[code] = {"type": body.type, "value": body.value, "active": body.active}
    return PromoCodeAdmin(code=code, type=body.type, value=str(body.value), active=body.active)


@router.patch("/promo/{code}", response_model=PromoCodeAdmin)
async def update_promo_code(code: str, body: PromoCodeUpdate, _: None = Depends(verify_admin)):
    key = code.upper()
    promo = PROMO_CODES.get(key)
    if not promo:
        raise HTTPException(status_code=404, detail="Promo code not found")
    updates = body.model_dump(exclude_unset=True)
    promo.update(updates)
    return PromoCodeAdmin(code=key, type=promo["type"], value=str(promo["value"]), active=promo.get("active", True))
