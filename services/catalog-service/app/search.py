import logging
from decimal import Decimal
from uuid import UUID

import meilisearch
from meilisearch.errors import MeilisearchApiError

from app.config import settings

logger = logging.getLogger(__name__)


class SearchIndex:
    def __init__(self) -> None:
        self._client = meilisearch.Client(settings.meilisearch_url, settings.meilisearch_key)
        self._index_name = settings.meilisearch_index

    def ensure_index(self) -> None:
        try:
            self._client.get_index(self._index_name)
        except MeilisearchApiError:
            self._client.create_index(self._index_name, {"primaryKey": "id"})
        index = self._client.index(self._index_name)
        index.update_searchable_attributes(["name", "description", "ingredients", "tags"])
        index.update_filterable_attributes(["category_slug", "tags", "price", "is_available"])
        index.update_sortable_attributes(["popularity_score", "price", "name"])

    def index_products(self, products: list[dict]) -> None:
        if not products:
            return
        self.ensure_index()
        index = self._client.index(self._index_name)
        index.update_documents(products)

    def search(
        self,
        query: str,
        *,
        autocomplete: bool = False,
        category: str | None = None,
        tags: list[str] | None = None,
        limit: int = 20,
    ) -> dict:
        self.ensure_index()
        index = self._client.index(self._index_name)
        filters: list[str] = ["is_available = true"]
        if category:
            filters.append(f'category_slug = "{category}"')
        if tags:
            tag_filters = " OR ".join(f'tags = "{t}"' for t in tags)
            filters.append(f"({tag_filters})")

        params: dict = {
            "limit": 5 if autocomplete else limit,
            "filter": " AND ".join(filters),
        }
        if autocomplete:
            params["attributesToRetrieve"] = ["id", "slug", "name", "price", "image_url", "category_slug"]
            params["attributesToHighlight"] = ["name"]

        result = index.search(query, params)
        return result

    def product_document(
        self,
        *,
        product_id: UUID,
        slug: str,
        name: str,
        description: str | None,
        price: Decimal,
        category_slug: str,
        tags: list[str],
        ingredients: list[str],
        image_url: str | None,
        is_available: bool,
        popularity_score: int,
    ) -> dict:
        return {
            "id": str(product_id),
            "slug": slug,
            "name": name,
            "description": description or "",
            "price": float(price),
            "category_slug": category_slug,
            "tags": tags,
            "ingredients": ingredients,
            "image_url": image_url,
            "is_available": is_available,
            "popularity_score": popularity_score,
        }
