from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import (
    BlogPostDetailResponse,
    BlogPostListResponse,
    CompanyInfoResponse,
    ReviewCreateRequest,
    ReviewListResponse,
    ReviewResponse,
    SeoPageResponse,
)
from app.services import ContentService, verify_order_auth

router = APIRouter(prefix="/api/v1")


async def get_content_service(db: AsyncSession = Depends(get_db)) -> ContentService:
    return ContentService(db)


@router.get("/reviews", response_model=ReviewListResponse)
async def list_reviews(
    product_id: UUID | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    service: ContentService = Depends(get_content_service),
):
    return await service.list_reviews(product_id=product_id, page=page, page_size=page_size)


@router.post("/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    payload: ReviewCreateRequest,
    order_id: UUID = Depends(verify_order_auth),
    service: ContentService = Depends(get_content_service),
):
    if payload.order_id is not None and payload.order_id != order_id:
        raise HTTPException(status_code=403, detail="Order ID mismatch")
    data = payload.model_copy(update={"order_id": payload.order_id or order_id})
    return await service.create_review(data)


@router.get("/blog", response_model=BlogPostListResponse)
async def list_blog_posts(
    limit: int = Query(10, ge=1, le=50),
    service: ContentService = Depends(get_content_service),
):
    return await service.list_blog_posts(limit=limit)


@router.get("/blog/{slug}", response_model=BlogPostDetailResponse)
async def get_blog_post(slug: str, service: ContentService = Depends(get_content_service)):
    post = await service.get_blog_post(slug)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post


@router.get("/pages/{slug}", response_model=SeoPageResponse)
async def get_seo_page(slug: str, service: ContentService = Depends(get_content_service)):
    page = await service.get_seo_page(slug)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.get("/company", response_model=CompanyInfoResponse)
async def get_company_info(service: ContentService = Depends(get_content_service)):
    info = await service.get_company_info()
    if not info:
        raise HTTPException(status_code=404, detail="Company info not found")
    return info
