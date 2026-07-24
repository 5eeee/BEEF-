"""Seed content database with reviews, blog posts, and company info."""

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings
from app.models import BlogPost, CompanyInfo, Review, SeoPage

logger = logging.getLogger(__name__)

COMPANY_ID = uuid.UUID("20000000-0000-0000-0000-000000000001")
PRODUCT_CLASSIC = uuid.UUID("00000000-0000-0000-0000-000000000001")

REVIEWS = [
    {
        "author_name": "Анна К.",
        "rating": 5,
        "text": "Классический бифштекс — лучший в городе! Сочная котлета и идеальная булочка.",
        "product_id": PRODUCT_CLASSIC,
    },
    {
        "author_name": "Дмитрий М.",
        "rating": 5,
        "text": "Заказываем каждую пятницу. Доставка всегда вовремя, бургеры горячие.",
        "product_id": None,
    },
    {
        "author_name": "Елена С.",
        "rating": 4,
        "text": "Очень вкусные картофель фри и соусы. Порции щедрые!",
        "product_id": None,
    },
    {
        "author_name": "Игорь В.",
        "rating": 5,
        "text": "Острый бургер — огонь! Для любителей пикантного идеально.",
        "product_id": None,
    },
    {
        "author_name": "Мария Л.",
        "rating": 5,
        "text": "Промокод WELCOME10 сработал, а бургер превзошёл ожидания. Рекомендую!",
        "product_id": None,
    },
]

BLOG_POSTS = [
    {
        "slug": "mramornaya-govyadina",
        "title": "Почему мы берём только мраморную говядину",
        "excerpt": "Коротко о жире 80/20, ручной котлете и том, почему бургер остаётся сочным до последней котлеты.",
        "content": (
            "В BEEFштекс котлета — это не «мясной шар из фарша». Мы берём мраморную говядину с балансом 80/20: "
            "достаточно жира, чтобы котлета оставалась сочной на гриле, и достаточно мяса, чтобы вкус был чистым и плотным.\n\n"
            "Котлету формуем вручную. Обжарка — на сильном жаре: корочка снаружи, сок внутри. "
            "Если хотите почувствовать разницу — начните с Кинг Конга или классического бифштекса."
        ),
        "cover_image_url": "/images/about/plated-signature-burger.png",
    },
    {
        "slug": "dostavka-kolomna-rio",
        "title": "Доставка по Коломне и самовывоз в Рио",
        "excerpt": "Где мы готовим, как быстро привозим и что важно знать про зоны доставки.",
        "content": (
            "Наш корнер — в ТРЦ Рио на фудкорте: ул. Октябрьской Революции, 362. "
            "Здесь же можно забрать заказ самовывозом.\n\n"
            "Доставку ведём по Коломне в рабочие зоны. Точные зоны смотрите на странице «О нас». "
            "Если впервые с нами — загляните в блок Акции на главной."
        ),
        "cover_image_url": "/images/about/delivery-zones-map.png",
    },
    {
        "slug": "kak-sobrat-idealnoe-kombo",
        "title": "Как собрать идеальное комбо",
        "excerpt": "Бургер + картофель + напиток: простые сочетания, которые реально работают.",
        "content": (
            "Комбо — не просто «всё сразу», а баланс вкусов.\n\n"
            "Классика: любой бифштекс + картофель фри + кола или морс. "
            "Острое: бургер с халапеньо + кисло-сладкий соус. "
            "Следите за акциями на главной — иногда выгоднее взять готовый набор."
        ),
        "cover_image_url": "/images/about/restaurant-pass.png",
    },
]

SEO_PAGES = [
    {
        "slug": "dostavka-burgerov",
        "title": "Доставка бургеров в Москве — Beefshteks",
        "meta_description": "Быстрая доставка сочных бургеров по Москве за 45 минут. Закажите онлайн!",
        "content": (
            "<h1>Доставка бургеров Beefshteks</h1>"
            "<p>Мы доставляем горячие бургеры, закуски и напитки по Москве в течение 45 минут.</p>"
            "<p>Минимальная сумма заказа — 500 ₽. Стоимость доставки — 199 ₽.</p>"
        ),
    },
]

COMPANY = {
    "id": COMPANY_ID,
    "name": "BEEFштекс",
    "tagline": "Бургеры с характером! Мы верим в мясо",
    "phone": "+7 (916) 035-67-77",
    "email": "hello@beefshteks.ru",
    "address": "Коломна, ул. Октябрьской Революции, 362, ТРЦ Рио, фудкорт",
    "working_hours": "Ежедневно с 10:00 до 22:00",
    "inn": "7701234567",
    "ogrn": "1027700132195",
}


async def seed_if_empty() -> bool:
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        count = (await session.execute(select(func.count()).select_from(Review))).scalar_one()
        if count > 0:
            await engine.dispose()
            return False

        for data in REVIEWS:
            session.add(Review(**data, is_published=True))

        now = datetime.now(timezone.utc)
        for data in BLOG_POSTS:
            session.add(BlogPost(**data, is_published=True, published_at=now))

        for data in SEO_PAGES:
            session.add(SeoPage(**data, is_published=True))

        session.add(CompanyInfo(**COMPANY))
        await session.commit()
        logger.info("Seeded content database")

    await engine.dispose()
    return True
