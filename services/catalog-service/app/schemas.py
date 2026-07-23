from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CategoryResponse(BaseModel):
    id: UUID
    slug: str
    name: str
    description: str | None = None
    image_url: str | None = None
    sort_order: int = 0

    model_config = ConfigDict(from_attributes=True)


class CategoryDetailResponse(CategoryResponse):
    product_count: int = 0


class ProductTagResponse(BaseModel):
    tag: str

    model_config = ConfigDict(from_attributes=True)


class IngredientResponse(BaseModel):
    name: str
    is_allergen: bool = False

    model_config = ConfigDict(from_attributes=True)


class ProductImageResponse(BaseModel):
    url: str
    alt_text: str | None = None
    sort_order: int = 0

    model_config = ConfigDict(from_attributes=True)


class ProductListItem(BaseModel):
    id: UUID
    slug: str
    name: str
    description: str | None = None
    price: Decimal
    is_available: bool
    popularity_score: int = 0
    image_url: str | None = None
    category_slug: str
    tags: list[str] = Field(default_factory=list)
    weight_grams: int | None = None
    calories: int | None = None

    model_config = ConfigDict(from_attributes=True)


class ProductDetailResponse(ProductListItem):
    weight_grams: int | None = None
    calories: int | None = None
    ingredients: list[IngredientResponse] = Field(default_factory=list)
    images: list[ProductImageResponse] = Field(default_factory=list)
    created_at: datetime | None = None


class ProductListResponse(BaseModel):
    items: list[ProductListItem]
    total: int
    page: int = 1
    page_size: int = 50


class SearchHit(BaseModel):
    id: UUID
    slug: str
    name: str
    price: Decimal
    image_url: str | None = None
    category_slug: str | None = None


class SearchResponse(BaseModel):
    query: str
    hits: list[SearchHit]
    total: int
    autocomplete: bool = False


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "catalog-service"
    version: str = "0.1.0"


class CategoryImportItem(BaseModel):
    slug: str
    name: str
    description: str | None = None
    sort_order: int = 0
    image_url: str | None = None


class IngredientImportItem(BaseModel):
    name: str
    is_allergen: bool = False


class ProductImportItem(BaseModel):
    slug: str
    category_slug: str
    name: str
    description: str | None = None
    price: Decimal
    weight_grams: int | None = None
    calories: int | None = None
    popularity_score: int = 0
    tags: list[str] = Field(default_factory=list)
    ingredients: list[IngredientImportItem] = Field(default_factory=list)
    image_url: str | None = None


class CatalogImportRequest(BaseModel):
    categories: list[CategoryImportItem] = Field(default_factory=list)
    products: list[ProductImportItem] = Field(default_factory=list)
    replace_existing: bool = False


class CatalogImportResponse(BaseModel):
    categories_created: int = 0
    products_created: int = 0
    message: str = "Import completed"


class AdminProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=256)
    description: str | None = Field(None, max_length=2000)
    price: Decimal | None = Field(None, ge=0)
    is_available: bool | None = None
    popularity_score: int | None = Field(None, ge=0)

