from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import (
    CategoryDetailResponse,
    CategoryResponse,
    ProductDetailResponse,
    ProductListResponse,
    SearchResponse,
)
from app.config import settings
from app.services import CatalogService

router = APIRouter(prefix="/api/v1")


async def get_catalog_service(db: AsyncSession = Depends(get_db)) -> CatalogService:
    return CatalogService(db, public_api_url=settings.public_api_url)


@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(service: CatalogService = Depends(get_catalog_service)):
    return await service.list_categories()


@router.get("/categories/{slug}", response_model=CategoryDetailResponse)
async def get_category(slug: str, service: CatalogService = Depends(get_catalog_service)):
    category = await service.get_category(slug)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.get("/products", response_model=ProductListResponse)
async def list_products(
    category: str | None = None,
    tags: str | None = Query(None, description="Comma-separated tags: spicy,vegetarian,new"),
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    sort: str = Query("popularity", pattern="^(popularity|price_asc|price_desc|name)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    service: CatalogService = Depends(get_catalog_service),
):
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else None
    return await service.list_products(
        category=category,
        tags=tag_list,
        min_price=min_price,
        max_price=max_price,
        sort=sort,
        page=page,
        page_size=page_size,
    )


@router.get("/products/{product_id}", response_model=ProductDetailResponse)
async def get_product(product_id: UUID, service: CatalogService = Depends(get_catalog_service)):
    product = await service.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/search", response_model=SearchResponse)
async def search_products(
    q: str = Query(..., min_length=1, max_length=128),
    autocomplete: bool = False,
    category: str | None = None,
    service: CatalogService = Depends(get_catalog_service),
):
    return await service.search_products(q, autocomplete=autocomplete, category=category)
