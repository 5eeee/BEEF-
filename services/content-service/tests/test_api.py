"""Content service tests."""

from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.routes import get_content_service
from app.schemas import (
    BlogPostDetailResponse,
    BlogPostListItem,
    BlogPostListResponse,
    CompanyInfoResponse,
    ReviewListResponse,
    ReviewResponse,
    SeoPageResponse,
)


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
def mock_service():
    return AsyncMock()


@pytest.fixture
async def client(mock_service):
    app.dependency_overrides[get_content_service] = lambda: mock_service
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["service"] == "content-service"


@pytest.mark.asyncio
async def test_list_reviews(client, mock_service):
    review_id = uuid4()
    mock_service.list_reviews.return_value = ReviewListResponse(
        items=[
            ReviewResponse(
                id=review_id,
                author_name="Анна",
                rating=5,
                text="Отлично!",
                created_at=datetime.now(timezone.utc),
            )
        ],
        total=1,
        page=1,
        page_size=20,
    )

    res = await client.get("/api/v1/reviews")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["items"][0]["author_name"] == "Анна"


@pytest.mark.asyncio
async def test_create_review_requires_auth(client):
    res = await client.post(
        "/api/v1/reviews",
        json={"author_name": "Test", "rating": 5, "text": "Great burger"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_create_review_with_order_header(client, mock_service):
    order_id = uuid4()
    review_id = uuid4()
    mock_service.create_review.return_value = ReviewResponse(
        id=review_id,
        author_name="Test",
        rating=5,
        text="Great burger",
        created_at=datetime.now(timezone.utc),
    )

    res = await client.post(
        "/api/v1/reviews",
        headers={"X-Order-Id": str(order_id)},
        json={"author_name": "Test", "rating": 5, "text": "Great burger"},
    )
    assert res.status_code == 201
    assert res.json()["id"] == str(review_id)


@pytest.mark.asyncio
async def test_list_blog(client, mock_service):
    post_id = uuid4()
    now = datetime.now(timezone.utc)
    mock_service.list_blog_posts.return_value = BlogPostListResponse(
        items=[
            BlogPostListItem(
                id=post_id,
                slug="test-post",
                title="Test",
                excerpt="Excerpt",
                published_at=now,
            )
        ],
        total=1,
    )

    res = await client.get("/api/v1/blog")
    assert res.status_code == 200
    assert res.json()["items"][0]["slug"] == "test-post"


@pytest.mark.asyncio
async def test_get_blog_post(client, mock_service):
    post_id = uuid4()
    now = datetime.now(timezone.utc)
    mock_service.get_blog_post.return_value = BlogPostDetailResponse(
        id=post_id,
        slug="test-post",
        title="Test",
        excerpt="Excerpt",
        content="Full content",
        published_at=now,
    )

    res = await client.get("/api/v1/blog/test-post")
    assert res.status_code == 200
    assert res.json()["content"] == "Full content"


@pytest.mark.asyncio
async def test_get_blog_post_not_found(client, mock_service):
    mock_service.get_blog_post.return_value = None
    res = await client.get("/api/v1/blog/missing")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_get_seo_page(client, mock_service):
    mock_service.get_seo_page.return_value = SeoPageResponse(
        slug="dostavka",
        title="Доставка",
        meta_description="Meta",
        content="<p>Content</p>",
    )

    res = await client.get("/api/v1/pages/dostavka")
    assert res.status_code == 200
    assert res.json()["title"] == "Доставка"


@pytest.mark.asyncio
async def test_get_company_info(client, mock_service):
    mock_service.get_company_info.return_value = CompanyInfoResponse(
        name="Beefshteks",
        tagline="Burgers",
        phone="+7 495 123-45-67",
    )

    res = await client.get("/api/v1/company")
    assert res.status_code == 200
    assert res.json()["name"] == "Beefshteks"
