"""Seed content database with reviews, blog posts, and company info."""

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

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
        "slug": "sekrety-idealnogo-burgera",
        "title": "Секреты идеального бургера от Beefshteks",
        "excerpt": "Рассказываем, из чего складывается наш фирменный бифштекс и почему он такой сочный.",
        "content": (
            "Наш классический бифштекс начинается с мраморной говядины 80/20 — "
            "идеальный баланс мяса и жира для сочности. Котлету формируем вручную "
            "и обжариваем на гриле при высокой температуре.\n\n"
            "Булочка бриошь поджаривается с маслом до золотистой корочки. "
            "Свежие овощи, фирменный соус и сыр чеддер завершают композицию. "
            "Попробуйте — и вы поймёте, почему нас заказывают снова и снова."
        ),
        "cover_image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
    },
    {
        "slug": "akcii-i-promokody",
        "title": "Акции и промокоды Beefshteks",
        "excerpt": "Как сэкономить на заказе: WELCOME10, комбо-наборы и сезонные предложения.",
        "content": (
            "Добро пожаловать в Beefshteks! Новым гостям дарим скидку 10% по промокоду WELCOME10.\n\n"
            "Следите за акциями на главной странице — мы регулярно запускаем комбо-наборы "
            "«Бургер + картофель + напиток» по специальной цене. "
            "Подпишитесь на push-уведомления, чтобы не пропустить выгодные предложения."
        ),
        "cover_image_url": "https://images.unsplash.com/photo-1550547214-883147c53d71?w=800&q=80",
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
