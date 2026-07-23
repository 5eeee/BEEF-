import type { Category, Product, ProductList } from "./types";

/** Static fallback when catalog-service is unavailable at build or runtime. */
export const FALLBACK_CATEGORIES: Category[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    slug: "burgers",
    name: "Бургеры",
    description: "Сочные бургеры на булочке бриошь с мраморной говядиной и фирменными соусами.",
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    slug: "starters",
    name: "Закуски",
    description: "Хрустящие закуски — идеальное дополнение к основному блюду.",
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    slug: "drinks",
    name: "Напитки",
    description: "Лимонады, морсы и прохладительные напитки собственного приготовления.",
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    slug: "combos",
    name: "Комбо",
    description: "Выгодные наборы: бургер, закуска и напиток в одной коробке.",
  },
];

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "klassicheskiy-burger",
    name: "Классический бургер",
    description:
      "Двойная котлета из отборной говядины, салат айсберг, маринованный огурец и соус бургер на тёплой булочке бриошь.",
    price: "450.00",
    is_available: true,
    popularity_score: 100,
    category_slug: "burgers",
    tags: ["new"],
    weight_grams: 320,
    calories: 680,
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    slug: "ostryy-burger",
    name: "Острый бургер",
    description: "Пикантный бургер с перцем халапеньо и острым соусом.",
    price: "490.00",
    is_available: true,
    popularity_score: 90,
    category_slug: "burgers",
    tags: ["spicy"],
    image_url: "https://images.unsplash.com/photo-1550547214-883147c53d71?w=800&q=80",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    slug: "kartofel-fri",
    name: "Картофель фри",
    description: "Золотистый картофель фри с морской солью.",
    price: "180.00",
    is_available: true,
    popularity_score: 80,
    category_slug: "starters",
    tags: [],
    image_url: "https://images.unsplash.com/photo-1573080496219-b998a60ff8b0?w=800&q=80",
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    slug: "limonad-klubnika",
    name: "Лимонад клубника",
    description: "Домашний лимонад со свежей клубникой.",
    price: "220.00",
    is_available: true,
    popularity_score: 70,
    category_slug: "drinks",
    tags: [],
    image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80",
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    slug: "kombo-klassik",
    name: "Комбо Классик",
    description: "Классический бургер, картофель фри и лимонад.",
    price: "790.00",
    is_available: true,
    popularity_score: 95,
    category_slug: "combos",
    tags: [],
    image_url: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80",
  },
];

export function fallbackProductList(category?: string): ProductList {
  const items = category
    ? FALLBACK_PRODUCTS.filter((p) => p.category_slug === category)
    : FALLBACK_PRODUCTS;
  return { items, total: items.length, page: 1, page_size: 100 };
}
