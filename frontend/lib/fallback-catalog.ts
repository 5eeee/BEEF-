import demo from "@/content/demo-catalog.json";
import type { Category, Product, ProductList } from "./types";

/** Full static menu for Vercel demo / offline API. */
export const FALLBACK_CATEGORIES: Category[] = demo.categories.map((c) => ({
  id: c.id,
  slug: c.slug,
  name: c.name,
  description: c.description || undefined,
  image_url: c.image_url || undefined,
}));

export const FALLBACK_PRODUCTS: Product[] = demo.products.map((p) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  description: p.description || undefined,
  price: String(p.price),
  is_available: p.is_available !== false,
  popularity_score: p.popularity_score ?? 50,
  category_slug: p.category_slug,
  tags: p.tags || [],
  weight_grams: p.weight_grams ?? undefined,
  calories: p.calories ?? undefined,
  image_url: p.image_url || undefined,
}));

export function fallbackProductList(params: {
  category?: string;
  tags?: string;
  sort?: string;
} = {}): ProductList {
  let items = [...FALLBACK_PRODUCTS];
  if (params.category) {
    items = items.filter((p) => p.category_slug === params.category);
  }
  if (params.tags) {
    const want = params.tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (want.length) {
      items = items.filter((p) => want.every((t) => p.tags.includes(t)));
    }
  }
  const sort = params.sort || "popularity";
  if (sort === "price_asc") items.sort((a, b) => Number(a.price) - Number(b.price));
  else if (sort === "price_desc") items.sort((a, b) => Number(b.price) - Number(a.price));
  else items.sort((a, b) => b.popularity_score - a.popularity_score);

  return { items, total: items.length, page: 1, page_size: items.length || 100 };
}

export function findFallbackProduct(idOrSlug: string): Product | undefined {
  return FALLBACK_PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}
