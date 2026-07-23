from decimal import Decimal

from fastapi import APIRouter, Request

from app.geocoding import suggest_address
from app.schemas import CalculateRequest, CalculateResponse, SuggestRequest, SuggestResponse

router = APIRouter(prefix="/api/v1")


@router.post("/delivery/calculate", response_model=CalculateResponse)
async def calculate(_body: CalculateRequest):
    return CalculateResponse(fee=Decimal("199.00"), eta_minutes=45)


@router.post("/delivery/geocode/suggest", response_model=SuggestResponse)
async def geocode_suggest(body: SuggestRequest, request: Request):
    redis = getattr(request.app.state, "redis", None)
    suggestions = await suggest_address(redis, body.query)
    return SuggestResponse(suggestions=suggestions)
