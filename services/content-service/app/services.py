from uuid import UUID

from fastapi import Header, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import BlogPost, CompanyInfo, Review, SeoPage
from app.schemas import (
    BlogPostDetailResponse,
    BlogPostListItem,
    BlogPostListResponse,
    CompanyInfoResponse,
    ReviewCreateRequest,
    ReviewListResponse,
    ReviewResponse,
    SeoPageResponse,
)


class ContentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_reviews(
        self,
        product_id: UUID | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> ReviewListResponse:
        query = select(Review).where(Review.is_published.is_(True))
        count_query = select(func.count()).select_from(Review).where(Review.is_published.is_(True))

        if product_id is not None:
            query = query.where(Review.product_id == product_id)
            count_query = count_query.where(Review.product_id == product_id)

        total = (await self.db.execute(count_query)).scalar_one()
        offset = (page - 1) * page_size
        result = await self.db.execute(
            query.order_by(Review.created_at.desc()).offset(offset).limit(page_size)
        )
        items = [ReviewResponse.model_validate(r) for r in result.scalars().all()]
        return ReviewListResponse(items=items, total=total, page=page, page_size=page_size)

    async def create_review(self, payload: ReviewCreateRequest) -> ReviewResponse:
        review = Review(
            author_name=payload.author_name,
            rating=payload.rating,
            text=payload.text,
            product_id=payload.product_id,
            order_id=payload.order_id,
            is_published=True,
        )
        self.db.add(review)
        await self.db.commit()
        await self.db.refresh(review)
        return ReviewResponse.model_validate(review)

    async def list_blog_posts(self, limit: int = 10) -> BlogPostListResponse:
        count_query = select(func.count()).select_from(BlogPost).where(BlogPost.is_published.is_(True))
        total = (await self.db.execute(count_query)).scalar_one()

        result = await self.db.execute(
            select(BlogPost)
            .where(BlogPost.is_published.is_(True))
            .order_by(BlogPost.published_at.desc())
            .limit(limit)
        )
        items = [BlogPostListItem.model_validate(p) for p in result.scalars().all()]
        return BlogPostListResponse(items=items, total=total)

    async def get_blog_post(self, slug: str) -> BlogPostDetailResponse | None:
        result = await self.db.execute(
            select(BlogPost).where(BlogPost.slug == slug, BlogPost.is_published.is_(True))
        )
        post = result.scalar_one_or_none()
        if not post:
            return None
        return BlogPostDetailResponse.model_validate(post)

    async def get_seo_page(self, slug: str) -> SeoPageResponse | None:
        result = await self.db.execute(
            select(SeoPage).where(SeoPage.slug == slug, SeoPage.is_published.is_(True))
        )
        page = result.scalar_one_or_none()
        if not page:
            return None
        return SeoPageResponse.model_validate(page)

    async def get_company_info(self) -> CompanyInfoResponse | None:
        result = await self.db.execute(select(CompanyInfo).limit(1))
        info = result.scalar_one_or_none()
        if not info:
            return None
        return CompanyInfoResponse.model_validate(info)


async def verify_order_auth(
    x_order_id: str | None = Header(None, alias="X-Order-Id"),
    authorization: str | None = Header(None),
) -> UUID:
    """Stub auth: require X-Order-Id header or Bearer token after order completion."""
    if x_order_id:
        try:
            return UUID(x_order_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid X-Order-Id") from exc

    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
        if token:
            try:
                return UUID(token)
            except ValueError:
                pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Order authentication required (X-Order-Id header)",
    )
