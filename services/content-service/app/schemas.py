from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "content-service"


class ReviewResponse(BaseModel):
    id: UUID
    author_name: str
    rating: int
    text: str
    product_id: UUID | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReviewListResponse(BaseModel):
    items: list[ReviewResponse]
    total: int
    page: int
    page_size: int


class ReviewCreateRequest(BaseModel):
    author_name: str = Field(..., min_length=1, max_length=128)
    rating: int = Field(..., ge=1, le=5)
    text: str = Field(..., min_length=1, max_length=2000)
    product_id: UUID | None = None
    order_id: UUID | None = None


class BlogPostListItem(BaseModel):
    id: UUID
    slug: str
    title: str
    excerpt: str | None = None
    cover_image_url: str | None = None
    published_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BlogPostListResponse(BaseModel):
    items: list[BlogPostListItem]
    total: int


class BlogPostDetailResponse(BlogPostListItem):
    content: str


class SeoPageResponse(BaseModel):
    slug: str
    title: str
    meta_description: str | None = None
    content: str

    model_config = ConfigDict(from_attributes=True)


class CompanyInfoResponse(BaseModel):
    name: str
    tagline: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    working_hours: str | None = None
    inn: str | None = None
    ogrn: str | None = None

    model_config = ConfigDict(from_attributes=True)
