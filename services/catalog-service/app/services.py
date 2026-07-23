import re
from decimal import Decimal
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Category, Ingredient, Product, ProductImage, ProductTag
from app.schemas import (
    CatalogImportRequest,
    CatalogImportResponse,
    CategoryDetailResponse,
    CategoryResponse,
    ProductDetailResponse,
    ProductListItem,
    ProductListResponse,
    SearchHit,
    SearchResponse,
)
from app.search import SearchIndex


def _primary_image(product: Product) -> str | None:
    if product.images:
        return product.images[0].url
    return None


def _product_tags(product: Product) -> list[str]:
    return [t.tag for t in product.tags]


def _normalize_media_url(url: str | None, public_api_url: str) -> str | None:
    if not url:
        return None
    if url.startswith("http://") or url.startswith("https://"):
        return url
    # Frontend static assets (scraped product photos / brand) stay as site-relative paths.
    if url.startswith("/images/"):
        return url
    base = public_api_url.rstrip("/")
    if url.startswith("/"):
        return f"{base}{url}"
    return f"{base}/{url}"


class CatalogService:
    def __init__(self, db: AsyncSession, search: SearchIndex | None = None, public_api_url: str = ""):
        self.db = db
        self.search = search or SearchIndex()
        self.public_api_url = public_api_url

    async def list_categories(self) -> list[CategoryResponse]:
        result = await self.db.execute(
            select(Category).where(Category.is_active.is_(True)).order_by(Category.sort_order, Category.name)
        )
        return [CategoryResponse.model_validate(c) for c in result.scalars().all()]

    async def get_category(self, slug: str) -> CategoryDetailResponse | None:
        result = await self.db.execute(select(Category).where(Category.slug == slug, Category.is_active.is_(True)))
        category = result.scalar_one_or_none()
        if not category:
            return None
        count_result = await self.db.execute(
            select(func.count()).select_from(Product).where(Product.category_id == category.id, Product.is_available)
        )
        return CategoryDetailResponse(
            **CategoryResponse.model_validate(category).model_dump(),
            product_count=count_result.scalar_one(),
        )

    async def list_products(
        self,
        *,
        category: str | None = None,
        tags: list[str] | None = None,
        min_price: Decimal | None = None,
        max_price: Decimal | None = None,
        sort: str = "popularity",
        page: int = 1,
        page_size: int = 50,
    ) -> ProductListResponse:
        query = (
            select(Product)
            .join(Category)
            .options(selectinload(Product.tags), selectinload(Product.images), selectinload(Product.category))
            .where(Product.is_available.is_(True), Category.is_active.is_(True))
        )

        if category:
            query = query.where(Category.slug == category)
        if min_price is not None:
            query = query.where(Product.price >= min_price)
        if max_price is not None:
            query = query.where(Product.price <= max_price)
        if tags:
            for tag in tags:
                query = query.where(Product.tags.any(tag=tag))

        count_query = select(func.count(Product.id)).select_from(Product).join(Category).where(
            Product.is_available.is_(True), Category.is_active.is_(True)
        )
        if category:
            count_query = count_query.where(Category.slug == category)
        if min_price is not None:
            count_query = count_query.where(Product.price >= min_price)
        if max_price is not None:
            count_query = count_query.where(Product.price <= max_price)
        if tags:
            for tag in tags:
                count_query = count_query.where(Product.tags.any(tag=tag))
        total = (await self.db.execute(count_query)).scalar_one()

        sort_map = {
            "popularity": Product.popularity_score.desc(),
            "price_asc": Product.price.asc(),
            "price_desc": Product.price.desc(),
            "name": Product.name.asc(),
        }
        query = query.order_by(sort_map.get(sort, Product.popularity_score.desc()))
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        products = result.scalars().unique().all()
        items = [self._to_list_item(p) for p in products]
        return ProductListResponse(items=items, total=total, page=page, page_size=page_size)

    async def get_product(self, product_id: UUID) -> ProductDetailResponse | None:
        result = await self.db.execute(
            select(Product)
            .options(
                selectinload(Product.tags),
                selectinload(Product.images),
                selectinload(Product.ingredients),
                selectinload(Product.category),
            )
            .where(Product.id == product_id)
        )
        product = result.scalar_one_or_none()
        if not product:
            return None
        return self._to_detail(product)

    async def search_products(self, q: str, *, autocomplete: bool = False, category: str | None = None) -> SearchResponse:
        if not q.strip():
            return SearchResponse(query=q, hits=[], total=0, autocomplete=autocomplete)

        try:
            raw = self.search.search(q, autocomplete=autocomplete, category=category)
            hits = [
                SearchHit(
                    id=UUID(h["id"]),
                    slug=h["slug"],
                    name=h["name"],
                    price=Decimal(str(h["price"])),
                    image_url=h.get("image_url"),
                    category_slug=h.get("category_slug"),
                )
                for h in raw.get("hits", [])
            ]
            return SearchResponse(
                query=q,
                hits=hits,
                total=raw.get("estimatedTotalHits", len(hits)),
                autocomplete=autocomplete,
            )
        except Exception:
            pattern = f"%{q}%"
            query = (
                select(Product)
                .join(Category)
                .options(selectinload(Product.images), selectinload(Product.category))
                .where(Product.is_available.is_(True), Product.name.ilike(pattern))
                .limit(5 if autocomplete else 20)
            )
            if category:
                query = query.where(Category.slug == category)
            result = await self.db.execute(query)
            products = result.scalars().unique().all()
            hits = [
                SearchHit(
                    id=p.id,
                    slug=p.slug,
                    name=p.name,
                    price=p.price,
                    image_url=_primary_image(p),
                    category_slug=p.category.slug,
                )
                for p in products
            ]
            return SearchResponse(query=q, hits=hits, total=len(hits), autocomplete=autocomplete)

    async def import_catalog(self, payload: CatalogImportRequest) -> CatalogImportResponse:
        if payload.replace_existing:
            await self.db.execute(delete(ProductImage))
            await self.db.execute(delete(ProductTag))
            await self.db.execute(delete(Ingredient))
            await self.db.execute(delete(Product))
            await self.db.execute(delete(Category))

        category_map: dict[str, Category] = {}
        categories_created = 0

        for item in payload.categories:
            image_url = _normalize_media_url(item.image_url, self.public_api_url)
            existing = await self.db.execute(select(Category).where(Category.slug == item.slug))
            category = existing.scalar_one_or_none()
            if category:
                category.name = item.name
                category.description = item.description
                category.sort_order = item.sort_order
                category.image_url = image_url
                category.is_active = True
            else:
                category = Category(
                    slug=item.slug,
                    name=item.name,
                    description=item.description,
                    sort_order=item.sort_order,
                    image_url=image_url,
                )
                self.db.add(category)
                categories_created += 1
            await self.db.flush()
            category_map[item.slug] = category

        products_created = 0
        for item in payload.products:
            category = category_map.get(item.category_slug)
            if not category:
                result = await self.db.execute(select(Category).where(Category.slug == item.category_slug))
                category = result.scalar_one_or_none()
            if not category:
                continue

            image_url = _normalize_media_url(item.image_url, self.public_api_url)
            existing = await self.db.execute(select(Product).where(Product.slug == item.slug))
            product = existing.scalar_one_or_none()
            if product:
                product.category_id = category.id
                product.name = item.name
                product.description = item.description
                product.price = item.price
                product.weight_grams = item.weight_grams
                product.calories = item.calories
                product.popularity_score = item.popularity_score
                product.is_available = True
                await self.db.execute(delete(ProductImage).where(ProductImage.product_id == product.id))
                await self.db.execute(delete(ProductTag).where(ProductTag.product_id == product.id))
                await self.db.execute(delete(Ingredient).where(Ingredient.product_id == product.id))
            else:
                product = Product(
                    slug=item.slug,
                    category_id=category.id,
                    name=item.name,
                    description=item.description,
                    price=item.price,
                    weight_grams=item.weight_grams,
                    calories=item.calories,
                    popularity_score=item.popularity_score,
                )
                self.db.add(product)
                products_created += 1

            await self.db.flush()
            if image_url:
                self.db.add(
                    ProductImage(product_id=product.id, url=image_url, alt_text=product.name, sort_order=0)
                )
            for tag in item.tags:
                if re.fullmatch(r"(spicy|vegetarian|new)", tag):
                    self.db.add(ProductTag(product_id=product.id, tag=tag))
            for ingredient in item.ingredients:
                self.db.add(
                    Ingredient(
                        product_id=product.id,
                        name=ingredient.name,
                        is_allergen=ingredient.is_allergen,
                    )
                )

        await self.db.commit()
        return CatalogImportResponse(
            categories_created=categories_created,
            products_created=products_created,
            message="Catalog imported successfully",
        )

    def _to_list_item(self, product: Product) -> ProductListItem:
        return ProductListItem(
            id=product.id,
            slug=product.slug,
            name=product.name,
            description=product.description,
            price=product.price,
            is_available=product.is_available,
            popularity_score=product.popularity_score,
            image_url=_primary_image(product),
            category_slug=product.category.slug,
            tags=_product_tags(product),
            weight_grams=product.weight_grams,
            calories=product.calories,
        )

    def _to_detail(self, product: Product) -> ProductDetailResponse:
        return ProductDetailResponse(
            id=product.id,
            slug=product.slug,
            name=product.name,
            description=product.description,
            price=product.price,
            is_available=product.is_available,
            popularity_score=product.popularity_score,
            image_url=_primary_image(product),
            category_slug=product.category.slug,
            tags=_product_tags(product),
            weight_grams=product.weight_grams,
            calories=product.calories,
            ingredients=[{"name": i.name, "is_allergen": i.is_allergen} for i in product.ingredients],
            images=[
                {"url": img.url, "alt_text": img.alt_text, "sort_order": img.sort_order} for img in product.images
            ],
            created_at=product.created_at,
        )
