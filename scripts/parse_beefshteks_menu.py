#!/usr/bin/env python3
"""Parse beefshteks.ru menu, upload images to media-service, seed catalog."""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import io
import json
import logging
import re
import sys
import unicodedata
from dataclasses import dataclass, field
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("parse_beefshteks_menu")

DEFAULT_BASE_URL = "https://beefshteks.ru"
DEFAULT_MEDIA_URL = "http://localhost:8000"
DEFAULT_CATALOG_URL = "http://localhost:8000"
DEFAULT_ADMIN_KEY = "dev-import-key"

CATEGORY_SLUGS = {
    "beef": "beef-burgers",
    "смэш": "smash-burgers",
    "smash": "smash-burgers",
    "стarter": "starters",
    "стартер": "starters",
    "закуск": "starters",
    "завтрак": "breakfast",
    "стрит": "street-box",
    "бокс": "street-box",
    "комбо": "combos",
    "салат": "salads",
    "напит": "drinks",
    "соус": "sauces",
}

DESCRIPTION_TEMPLATES = [
    "{name} — {hint}. Готовим по заказу, чтобы сохранить сочность и аромат.",
    "Попробуйте {name}: {hint}. Идеальный выбор для тех, кто ценит насыщенный вкус.",
    "{name} с {hint}. Подаём горячим — аппетитный вариант из нашего меню.",
    "Сытный {name} с {hint}. Сбалансированное сочетание текстур и вкуса.",
]

CATEGORY_HINTS = {
    "beef-burgers": "мраморной говядиной и фирменным соусом на булочке бриошь",
    "smash-burgers": "хрустящей корочкой смэш-котлеты и сливочным сыром",
    "starters": "хрустящей текстурой и яркой подачей",
    "breakfast": "утренней свежестью и сытной начинкой",
    "street-box": "удобной подачей и насыщенным вкусом",
    "combos": "выгодным набором блюд в одной коробке",
    "salads": "свежими овощами и лёгкой заправкой",
    "drinks": "освежающим вкусом без лишней сладости",
    "sauces": "насыщенным ароматом — дополнит любое блюдо",
    "other": "отборными ингредиентами и аккуратной подачей",
}


@dataclass
class ParsedProduct:
    name: str
    price: Decimal
    image_url: str | None
    category_slug: str
    category_name: str
    source_description: str | None = None
    tags: list[str] = field(default_factory=list)


@dataclass
class ParsedCategory:
    slug: str
    name: str
    image_url: str | None = None


def slugify(text: str) -> str:
    original = text
    text = unicodedata.normalize("NFKD", text.lower())
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    if text:
        return text
    digest = hashlib.md5(original.encode("utf-8"), usedforsecurity=False).hexdigest()[:8]
    return f"item-{digest}"


def parse_price(raw: str) -> Decimal | None:
    cleaned = re.sub(r"[^\d.,]", "", raw.replace("\xa0", " "))
    cleaned = cleaned.replace(",", ".")
    if not cleaned:
        return None
    try:
        return Decimal(cleaned).quantize(Decimal("0.01"))
    except InvalidOperation:
        return None


def detect_category_slug(name: str) -> str:
    lowered = name.lower()
    for needle, slug in CATEGORY_SLUGS.items():
        if needle in lowered:
            return slug
    return "other"


def rewrite_description(name: str, category_slug: str, source: str | None = None) -> str:
    hint = CATEGORY_HINTS.get(category_slug, CATEGORY_HINTS["other"])
    idx = sum(ord(c) for c in name) % len(DESCRIPTION_TEMPLATES)
    description = DESCRIPTION_TEMPLATES[idx].format(name=name.strip(), hint=hint)
    if source:
        source_norm = re.sub(r"\s+", " ", source.strip().lower())
        desc_norm = re.sub(r"\s+", " ", description.lower())
        if source_norm and source_norm in desc_norm:
            description = f"{description} Отличный выбор для перекуса или полноценного приёма пищи."
    return description


def extract_image_url(element) -> str | None:
    if element is None:
        return None
    for attr in ("data-original", "data-src", "data-img-zoom-url", "src"):
        value = element.get(attr)
        if value and not value.startswith("data:"):
            return value
    style = element.get("style", "")
    match = re.search(r"url\(['\"]?(.*?)['\"]?\)", style)
    return match.group(1) if match else None


def parse_menu_html(html: str, base_url: str) -> tuple[list[ParsedCategory], list[ParsedProduct]]:
    soup = BeautifulSoup(html, "html.parser")
    categories: dict[str, ParsedCategory] = {}
    products: list[ParsedProduct] = []
    current_category_name = "Меню"
    current_category_slug = "other"

    for heading in soup.select("h1, h2, h3, .t-name, .t-title"):
        text = heading.get_text(" ", strip=True)
        if not text or len(text) > 80:
            continue
        if any(word in text.lower() for word in ("доставка", "контакт", "cookie", "заказать")):
            continue
        slug = detect_category_slug(text)
        if slug != "other" or len(text.split()) <= 4:
            current_category_name = text
            current_category_slug = slug if slug != "other" else slugify(text)
            categories.setdefault(
                current_category_slug,
                ParsedCategory(slug=current_category_slug, name=current_category_name),
            )

    cards = soup.select(
        ".t-store__card, .js-product, .t-store__prod-popup, .t-store__card__wrap, .t-records .t-item"
    )
    if not cards:
        cards = soup.select("[class*='t-store'], [class*='product']")

    seen_names: set[str] = set()
    for card in cards:
        title_el = card.select_one(
            ".t-store__card__title, .js-product-name, .t-name, .t-store__prod-popup__name, h3, h4"
        )
        price_el = card.select_one(
            ".t-store__card__price-value, .js-product-price, .t-store__prod-popup__price, .t-price"
        )
        if not title_el:
            continue
        name = title_el.get_text(" ", strip=True)
        if not name or name in seen_names or len(name) < 2:
            continue

        price = Decimal("0.00")
        if price_el:
            parsed = parse_price(price_el.get_text(" ", strip=True))
            if parsed is not None:
                price = parsed
        if price <= 0:
            continue

        img_el = card.select_one("img, .t-store__card__img, .t-bgimg")
        image_url = extract_image_url(img_el)
        if image_url:
            image_url = urljoin(base_url, image_url)

        desc_el = card.select_one(".t-store__card__descr, .t-descr, .js-product-descr, p")
        source_description = desc_el.get_text(" ", strip=True) if desc_el else None

        category_slug = current_category_slug
        category_name = current_category_name
        section = card.find_previous(["h1", "h2", "h3"])
        if section:
            section_text = section.get_text(" ", strip=True)
            if section_text:
                category_slug = detect_category_slug(section_text)
                if category_slug == "other":
                    category_slug = slugify(section_text)
                category_name = section_text
                categories.setdefault(category_slug, ParsedCategory(slug=category_slug, name=category_name))

        tags: list[str] = []
        lowered = name.lower()
        if any(word in lowered for word in ("острый", "чили", "халап", "spicy")):
            tags.append("spicy")
        if any(word in lowered for word in ("вег", "veggie", "овощ")):
            tags.append("vegetarian")
        if any(word in lowered for word in ("новин", "new")):
            tags.append("new")

        seen_names.add(name)
        products.append(
            ParsedProduct(
                name=name,
                price=price,
                image_url=image_url,
                category_slug=category_slug,
                category_name=category_name,
                source_description=source_description,
                tags=tags,
            )
        )
        if image_url and category_slug in categories and not categories[category_slug].image_url:
            categories[category_slug].image_url = image_url

    if not products:
        for block in soup.select(".t-store, .t-records"):
            text = block.get_text("\n", strip=True)
            for line in text.splitlines():
                match = re.match(r"^(.+?)\s+(\d[\d\s.,]*)\s*(?:₽|руб\.?)?$", line.strip())
                if not match:
                    continue
                name = match.group(1).strip()
                parsed = parse_price(match.group(2))
                if not parsed or name in seen_names:
                    continue
                slug = detect_category_slug(name)
                categories.setdefault(slug, ParsedCategory(slug=slug, name=slug.replace("-", " ").title()))
                seen_names.add(name)
                products.append(
                    ParsedProduct(
                        name=name,
                        price=parsed,
                        image_url=None,
                        category_slug=slug,
                        category_name=categories[slug].name,
                    )
                )

    return list(categories.values()), products


async def fetch_pages(client: httpx.AsyncClient, base_url: str) -> str:
    urls = [base_url.rstrip("/"), f"{base_url.rstrip('/')}/"]
    combined: list[str] = []
    for url in urls:
        try:
            response = await client.get(url, timeout=30.0)
            response.raise_for_status()
            combined.append(response.text)
        except httpx.HTTPError as exc:
            logger.warning("Failed to fetch %s: %s", url, exc)
    if not combined:
        raise RuntimeError(f"Could not fetch menu from {base_url}")
    return "\n".join(combined)


async def upload_image(client: httpx.AsyncClient, media_base: str, image_url: str) -> str | None:
    try:
        image_response = await client.get(image_url, timeout=30.0)
        image_response.raise_for_status()
        content_type = image_response.headers.get("content-type", "image/jpeg")
        filename = Path(urlparse(image_url).path).name or "image.jpg"
        files = {"file": (filename, io.BytesIO(image_response.content), content_type)}
        upload_response = await client.post(f"{media_base.rstrip('/')}/api/v1/media/upload", files=files, timeout=60.0)
        upload_response.raise_for_status()
        payload = upload_response.json()
        return payload["url"]
    except httpx.HTTPError as exc:
        logger.warning("Image upload failed for %s: %s", image_url, exc)
        return None


def build_catalog_payload(
    categories: list[ParsedCategory],
    products: list[ParsedProduct],
    media_urls: dict[str, str],
) -> dict[str, Any]:
    category_payload = []
    for index, category in enumerate(sorted(categories, key=lambda c: c.slug)):
        image_url = media_urls.get(f"category:{category.slug}") or category.image_url
        category_payload.append(
            {
                "slug": category.slug,
                "name": category.name,
                "description": rewrite_description(category.name, category.slug),
                "sort_order": index + 1,
                "image_url": image_url,
            }
        )

    product_payload = []
    for index, product in enumerate(products):
        image_key = f"product:{product.name}"
        product_payload.append(
            {
                "slug": slugify(product.name),
                "category_slug": product.category_slug,
                "name": product.name,
                "description": rewrite_description(product.name, product.category_slug, product.source_description),
                "price": str(product.price),
                "weight_grams": None,
                "calories": None,
                "popularity_score": max(10, 100 - index),
                "tags": product.tags,
                "ingredients": [],
                "image_url": media_urls.get(image_key),
            }
        )

    return {
        "categories": category_payload,
        "products": product_payload,
        "replace_existing": True,
    }


async def seed_catalog(client: httpx.AsyncClient, catalog_base: str, admin_key: str, payload: dict[str, Any]) -> None:
    response = await client.post(
        f"{catalog_base.rstrip('/')}/api/v1/admin/catalog/import",
        json=payload,
        headers={"X-Admin-Key": admin_key},
        timeout=120.0,
    )
    response.raise_for_status()
    logger.info("Catalog import response: %s", response.json())


async def run(args: argparse.Namespace) -> dict[str, Any]:
    async with httpx.AsyncClient(
        headers={"User-Agent": "BeefshteksMenuParser/1.0"},
        follow_redirects=True,
    ) as client:
        html = await fetch_pages(client, args.base_url)
        categories, products = parse_menu_html(html, args.base_url)
        logger.info("Parsed %d categories and %d products", len(categories), len(products))

        media_urls: dict[str, str] = {}
        if not args.skip_upload:
            for category in categories:
                if category.image_url and f"category:{category.slug}" not in media_urls:
                    uploaded = await upload_image(client, args.media_url, category.image_url)
                    if uploaded:
                        media_urls[f"category:{category.slug}"] = uploaded

            for product in products:
                if not product.image_url:
                    continue
                key = f"product:{product.name}"
                if key in media_urls:
                    continue
                uploaded = await upload_image(client, args.media_url, product.image_url)
                if uploaded:
                    media_urls[key] = uploaded

        payload = build_catalog_payload(categories, products, media_urls)

        output_path = Path(args.output) if args.output else None
        if output_path:
            output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            logger.info("Wrote %s", output_path)

        if args.seed:
            await seed_catalog(client, args.catalog_url, args.admin_key, payload)

        return payload


def main() -> int:
    parser = argparse.ArgumentParser(description="Parse beefshteks.ru menu and seed catalog via media-service")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--media-url", default=DEFAULT_MEDIA_URL, help="Media-service base URL (via Traefik)")
    parser.add_argument("--catalog-url", default=DEFAULT_CATALOG_URL, help="Catalog-service base URL (via Traefik)")
    parser.add_argument("--admin-key", default=DEFAULT_ADMIN_KEY)
    parser.add_argument("--output", default="scripts/beefshteks_menu.json", help="JSON output path")
    parser.add_argument("--seed", action="store_true", help="POST parsed menu to catalog-service")
    parser.add_argument("--skip-upload", action="store_true", help="Skip media uploads (JSON only)")
    args = parser.parse_args()

    try:
        payload = asyncio.run(run(args))
        print(json.dumps({"products": len(payload["products"]), "categories": len(payload["categories"])}, ensure_ascii=False))
        return 0
    except Exception as exc:
        logger.exception("Parser failed: %s", exc)
        return 1


if __name__ == "__main__":
    sys.exit(main())
