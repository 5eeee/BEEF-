import hashlib
import json
import logging

import httpx
import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)

MOCK_SUGGESTIONS = [
    "г Москва, ул Тверская, д 1",
    "г Москва, ул Арбат, д 10",
    "г Москва, Ленинский проспект, д 45",
    "г Москва, ул Новый Арбат, д 21",
]

CACHE_PREFIX = "dadata:suggest:"


def _cache_key(query: str) -> str:
    normalized = query.lower().strip()
    digest = hashlib.sha256(normalized.encode()).hexdigest()[:16]
    return f"{CACHE_PREFIX}{digest}"


def _mock_suggestions(query: str) -> list[str]:
    q = query.lower().strip()
    if len(q) < 2:
        return []
    hits = [s for s in MOCK_SUGGESTIONS if q in s.lower()]
    return hits or MOCK_SUGGESTIONS[:2]


async def _fetch_dadata(query: str) -> list[str]:
    headers = {
        "Authorization": f"Token {settings.dadata_api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {"query": query, "count": 10}

    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.post(settings.dadata_suggest_url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

    return [item["value"] for item in data.get("suggestions", []) if item.get("value")]


async def suggest_address(redis: aioredis.Redis | None, query: str) -> list[str]:
    q = query.strip()
    if len(q) < 2:
        return []

    cache_key = _cache_key(q)
    if redis is not None:
        try:
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception as exc:
            logger.warning("Redis cache read failed: %s", exc)

    if not settings.dadata_api_key:
        suggestions = _mock_suggestions(q)
    else:
        try:
            suggestions = await _fetch_dadata(q)
        except Exception as exc:
            logger.warning("DaData request failed, using mock: %s", exc)
            suggestions = _mock_suggestions(q)

    if redis is not None and suggestions:
        try:
            await redis.setex(cache_key, settings.suggest_cache_ttl, json.dumps(suggestions, ensure_ascii=False))
        except Exception as exc:
            logger.warning("Redis cache write failed: %s", exc)

    return suggestions
