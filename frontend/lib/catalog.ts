import {
  FALLBACK_CATEGORIES,
  FALLBACK_PRODUCTS,
  fallbackProductList,
} from "./fallback-catalog";
import { REVALIDATE_SECONDS } from "./site";
import type { Category, Product, ProductList } from "./types";
import { API_URL } from "./types";

type CategoryDetail = Category & { product_count?: number };

async function catalogFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  const data = await catalogFetch<Category[]>("/api/v1/categories");
  return data?.length ? data : FALLBACK_CATEGORIES;
}

export async function getCategory(slug: string): Promise<CategoryDetail | null> {
  const data = await catalogFetch<CategoryDetail>(`/api/v1/categories/${slug}`);
  if (data) return data;

  const fallback = FALLBACK_CATEGORIES.find((c) => c.slug === slug);
  if (!fallback) return null;

  const productCount = FALLBACK_PRODUCTS.filter((p) => p.category_slug === slug).length;
  return { ...fallback, product_count: productCount };
}

export async function getProducts(params: Record<string, string> = {}): Promise<ProductList> {
  const qs = new URLSearchParams({ page_size: "100", ...params }).toString();
  const data = await catalogFetch<ProductList>(`/api/v1/products?${qs}`);
  if (data?.items?.length) return data;
  return fallbackProductList(params);
}

export async function getAllProductSlugs(): Promise<string[]> {
  const data = await getProducts();
  return data.items.map((p) => p.slug);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const list = await getProducts();
  const match = list.items.find((p) => p.slug === slug);
  if (!match) {
    return FALLBACK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }

  const detail = await catalogFetch<Product>(`/api/v1/products/${match.id}`);
  return detail ?? match;
}
