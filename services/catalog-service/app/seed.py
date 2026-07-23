"""Seed catalog database with mock Beefshteks menu."""

import asyncio
import logging
import uuid
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models import Category, Ingredient, Product, ProductImage, ProductTag
from app.search import SearchIndex

logger = logging.getLogger(__name__)

MOCK_PRODUCT_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

CAT_BURGERS = uuid.UUID("10000000-0000-0000-0000-000000000001")
CAT_STARTERS = uuid.UUID("10000000-0000-0000-0000-000000000002")
CAT_DRINKS = uuid.UUID("10000000-0000-0000-0000-000000000003")
CAT_COMBOS = uuid.UUID("10000000-0000-0000-0000-000000000004")

IMG_BURGER = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80"
IMG_BURGER2 = "https://images.unsplash.com/photo-1550547214-883147c53d71?w=800&q=80"
IMG_FRIES = "https://images.unsplash.com/photo-1573080496219-b998a60ff8b0?w=800&q=80"
IMG_DRINK = "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80"
IMG_COMBO = "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80"
IMG_NUGGETS = "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80"

CATEGORIES = [
    {
        "id": CAT_BURGERS,
        "slug": "burgers",
        "name": "Бургеры",
        "description": "Сочные бургеры на булочке бриошь с мраморной говядиной и фирменными соусами.",
        "sort_order": 1,
        "image_url": IMG_BURGER,
    },
    {
        "id": CAT_STARTERS,
        "slug": "starters",
        "name": "Закуски",
        "description": "Хрустящие закуски — идеальное дополнение к основному блюду.",
        "sort_order": 2,
        "image_url": IMG_FRIES,
    },
    {
        "id": CAT_DRINKS,
        "slug": "drinks",
        "name": "Напитки",
        "description": "Лимонады, морсы и прохладительные напитки собственного приготовления.",
        "sort_order": 3,
        "image_url": IMG_DRINK,
    },
    {
        "id": CAT_COMBOS,
        "slug": "combos",
        "name": "Комбо",
        "description": "Выгодные наборы: бургер, закуска и напиток в одной коробке.",
        "sort_order": 4,
        "image_url": IMG_COMBO,
    },
]

PRODUCTS = [
    {
        "id": MOCK_PRODUCT_ID,
        "category_id": CAT_BURGERS,
        "slug": "klassicheskiy-burger",
        "name": "Классический бургер",
        "description": "Двойная котлета из отборной говядины, салат айсберг, маринованный огурец и соус бургер на тёплой булочке бриошь.",
        "price": Decimal("450.00"),
        "weight_grams": 320,
        "calories": 680,
        "popularity_score": 100,
        "tags": ["new"],
        "ingredients": [
            ("Булочка бриошь", False),
            ("Говяжья котлета", False),
            ("Сыр чеддер", True),
            ("Салат айсберг", False),
            ("Огурец маринованный", False),
            ("Соус бургер", False),
        ],
        "image": IMG_BURGER,
    },
    {
        "id": uuid.UUID("20000000-0000-0000-0000-000000000002"),
        "category_id": CAT_BURGERS,
        "slug": "ostryy-burger",
        "name": "Острый бургер",
        "description": "Пикантная котлета с перцем чили, хрустящий бекон, сыр и фирменный соус срирача — для тех, кто любит жар.",
        "price": Decimal("520.00"),
        "weight_grams": 340,
        "calories": 720,
        "popularity_score": 85,
        "tags": ["spicy"],
        "ingredients": [
            ("Булочка бриошь", False),
            ("Говяжья котлета", False),
            ("Бекон", False),
            ("Сыр чеддер", True),
            ("Перец халапеньо", False),
            ("Соус срирача", False),
        ],
        "image": IMG_BURGER2,
    },
    {
        "id": uuid.UUID("20000000-0000-0000-0000-000000000003"),
        "category_id": CAT_BURGERS,
        "slug": "gribnoy-burger",
        "name": "Грибной бургер",
        "description": "Нежная котлета с обжаренными шампиньонами, карамелизированным луком и сливочным соусом — сытно и ароматно.",
        "price": Decimal("490.00"),
        "weight_grams": 330,
        "calories": 650,
        "popularity_score": 70,
        "tags": ["vegetarian"],
        "ingredients": [
            ("Булочка бриошь", False),
            ("Котлета растительная", False),
            ("Шампиньоны", False),
            ("Лук карамелизованный", False),
            ("Сливочный соус", True),
        ],
        "image": IMG_BURGER,
    },
    {
        "id": uuid.UUID("20000000-0000-0000-0000-000000000004"),
        "category_id": CAT_STARTERS,
        "slug": "kartofel-fri",
        "name": "Картофель фри",
        "description": "Золотистый картофель с хрустящей корочкой, подаётся с кетчупом или сырным соусом на выбор.",
        "price": Decimal("190.00"),
        "weight_grams": 150,
        "calories": 380,
        "popularity_score": 90,
        "tags": ["vegetarian"],
        "ingredients": [("Картофель", False), ("Растительное масло", False), ("Соль", False)],
        "image": IMG_FRIES,
    },
    {
        "id": uuid.UUID("20000000-0000-0000-0000-000000000005"),
        "category_id": CAT_STARTERS,
        "slug": "naggetsy-kurinye",
        "name": "Куриные наггетсы",
        "description": "Шесть кусочков нежного куриного филе в панировке — хрустят снаружи, остаются сочными внутри.",
        "price": Decimal("260.00"),
        "weight_grams": 180,
        "calories": 420,
        "popularity_score": 75,
        "tags": [],
        "ingredients": [("Куриное филе", False), ("Панировка", True), ("Специи", False)],
        "image": IMG_NUGGETS,
    },
    {
        "id": uuid.UUID("20000000-0000-0000-0000-000000000006"),
        "category_id": CAT_STARTERS,
        "slug": "lukovye-koltsa",
        "name": "Луковые кольца",
        "description": "Крупные кольца красного лука в хрустящей панировке — классическая закуска к бургеру.",
        "price": Decimal("210.00"),
        "weight_grams": 140,
        "calories": 350,
        "popularity_score": 60,
        "tags": ["vegetarian"],
        "ingredients": [("Лук красный", False), ("Панировка", True), ("Растительное масло", False)],
        "image": IMG_FRIES,
    },
    {
        "id": uuid.UUID("20000000-0000-0000-0000-000000000007"),
        "category_id": CAT_DRINKS,
        "slug": "limonad-klubnika",
        "name": "Лимонад клубничный",
        "description": "Домашний лимонад на основе свежей клубники и лайма — освежает без лишней сладости.",
        "price": Decimal("180.00"),
        "weight_grams": 400,
        "calories": 90,
        "popularity_score": 80,
        "tags": ["vegetarian", "new"],
        "ingredients": [("Клубника", False), ("Лайм", False), ("Вода газированная", False), ("Сахар", False)],
        "image": IMG_DRINK,
    },
    {
        "id": uuid.UUID("20000000-0000-0000-0000-000000000008"),
        "category_id": CAT_DRINKS,
        "slug": "mors-klyukva",
        "name": "Морс клюквенный",
        "description": "Натуральный морс из отборной клюквы — кисло-сладкий, идеален к сытным бургерам.",
        "price": Decimal("160.00"),
        "weight_grams": 400,
        "calories": 70,
        "popularity_score": 65,
        "tags": ["vegetarian"],
        "ingredients": [("Клюква", False), ("Вода", False), ("Сахар", False)],
        "image": IMG_DRINK,
    },
    {
        "id": uuid.UUID("20000000-0000-0000-0000-000000000009"),
        "category_id": CAT_DRINKS,
        "slug": "kola",
        "name": "Кола 0.5 л",
        "description": "Классическая газировка в стеклянной бутылке — холодная, с пузырьками.",
        "price": Decimal("120.00"),
        "weight_grams": 500,
        "calories": 210,
        "popularity_score": 55,
        "tags": [],
        "ingredients": [("Газированная вода", False), ("Сахар", False), ("Карамель", False)],
        "image": IMG_DRINK,
    },
    {
        "id": uuid.UUID("20000000-0000-0000-0000-000000000010"),
        "category_id": CAT_COMBOS,
        "slug": "kombo-klassik",
        "name": "Комбо «Классик»",
        "description": "Классический бургер, картофель фри и клубничный лимонад — полноценный обед в одной коробке.",
        "price": Decimal("690.00"),
        "weight_grams": 870,
        "calories": 1150,
        "popularity_score": 95,
        "tags": ["new"],
        "ingredients": [
            ("Бургер классический", False),
            ("Картофель фри", False),
            ("Лимонад клубничный", False),
        ],
        "image": IMG_COMBO,
    },
    {
        "id": uuid.UUID("20000000-0000-0000-0000-000000000011"),
        "category_id": CAT_COMBOS,
        "slug": "kombo-ostryy",
        "name": "Комбо «Острый»",
        "description": "Острый бургер, куриные наггетсы и кола — для голодных и смелых.",
        "price": Decimal("750.00"),
        "weight_grams": 1020,
        "calories": 1350,
        "popularity_score": 88,
        "tags": ["spicy"],
        "ingredients": [
            ("Бургер острый", False),
            ("Наггетсы куриные", False),
            ("Кола 0.5 л", False),
        ],
        "image": IMG_COMBO,
    },
    {
        "id": uuid.UUID("20000000-0000-0000-0000-000000000012"),
        "category_id": CAT_COMBOS,
        "slug": "kombo-veggie",
        "name": "Комбо «Вегги»",
        "description": "Грибной бургер, луковые кольца и клюквенный морс — сбалансированный набор без мяса.",
        "price": Decimal("720.00"),
        "weight_grams": 870,
        "calories": 1070,
        "popularity_score": 72,
        "tags": ["vegetarian"],
        "ingredients": [
            ("Бургер грибной", False),
            ("Луковые кольца", False),
            ("Морс клюквенный", False),
        ],
        "image": IMG_COMBO,
    },
]


async def seed_if_empty() -> bool:
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        count = (await session.execute(select(func.count()).select_from(Category))).scalar_one()
        if count > 0:
            await engine.dispose()
            return False

        for cat_data in CATEGORIES:
            session.add(Category(**cat_data))

        for item in PRODUCTS:
            tags = item["tags"]
            ingredients = item["ingredients"]
            image = item["image"]
            product = Product(
                id=item["id"],
                category_id=item["category_id"],
                slug=item["slug"],
                name=item["name"],
                description=item["description"],
                price=item["price"],
                weight_grams=item["weight_grams"],
                calories=item["calories"],
                popularity_score=item["popularity_score"],
            )
            session.add(product)
            await session.flush()
            session.add(ProductImage(product_id=product.id, url=image, alt_text=product.name, sort_order=0))
            for tag in tags:
                session.add(ProductTag(product_id=product.id, tag=tag))
            for name, is_allergen in ingredients:
                session.add(Ingredient(product_id=product.id, name=name, is_allergen=is_allergen))

        await session.commit()

    await engine.dispose()
    return True


def sync_search_index() -> None:
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)

    async def _load() -> list[dict]:
        session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with session_factory() as session:
            result = await session.execute(
                select(Product)
                .options(
                    selectinload(Product.tags),
                    selectinload(Product.ingredients),
                    selectinload(Product.images),
                    selectinload(Product.category),
                )
            )
            products = result.scalars().unique().all()
            search = SearchIndex()
            docs = []
            for p in products:
                docs.append(
                    search.product_document(
                        product_id=p.id,
                        slug=p.slug,
                        name=p.name,
                        description=p.description,
                        price=p.price,
                        category_slug=p.category.slug,
                        tags=[t.tag for t in p.tags],
                        ingredients=[i.name for i in p.ingredients],
                        image_url=p.images[0].url if p.images else None,
                        is_available=p.is_available,
                        popularity_score=p.popularity_score,
                    )
                )
            return docs

    docs = asyncio.run(_load())
    SearchIndex().index_products(docs)
    asyncio.run(engine.dispose())


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed_if_empty())
    sync_search_index()
    logger.info("Seed complete")
