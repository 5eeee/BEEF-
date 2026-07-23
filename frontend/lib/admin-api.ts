import type { Order, Product, ProductList } from "./types";
import { getAdminHeaders } from "./admin-auth";

const API_URL =
  typeof window !== "undefined"
    ? ""
    : process.env.API_PROXY_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  Object.entries(getAdminHeaders()).forEach(([k, v]) => headers.set(k, v));

  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = err.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail[0]?.msg || res.statusText
          : res.statusText;
    throw new Error(message);
  }
  return res.json();
}

export type AdminStats = {
  orders_today: number;
  revenue_today: string;
  active_orders: number;
  date: string;
};

export type PromoCode = {
  code: string;
  type: string;
  value: string;
  active: boolean;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
  status: string;
  created_at: string;
};

export async function fetchAdminStats(): Promise<AdminStats> {
  return adminFetch("/api/v1/admin/stats");
}

export async function fetchAdminOrders(status?: string): Promise<Order[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return adminFetch(`/api/v1/admin/orders${qs}`);
}

export async function updateAdminOrderStatus(orderId: string, status: string): Promise<Order> {
  return adminFetch(`/api/v1/admin/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchAdminProducts(): Promise<ProductList> {
  return adminFetch("/api/v1/admin/products?page_size=200");
}

export async function updateAdminProduct(
  productId: string,
  data: Partial<Pick<Product, "name" | "price" | "is_available" | "description">>
): Promise<Product> {
  const body: Record<string, unknown> = { ...data };
  if (body.price !== undefined) body.price = String(body.price);
  return adminFetch(`/api/v1/admin/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function fetchAdminPromos(): Promise<PromoCode[]> {
  return adminFetch("/api/v1/admin/promo");
}

export async function updateAdminPromo(
  code: string,
  data: Partial<{ type: string; value: string; active: boolean }>
): Promise<PromoCode> {
  return adminFetch(`/api/v1/admin/promo/${encodeURIComponent(code)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function fetchAdminReviews(status?: string): Promise<Review[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return adminFetch(`/api/v1/admin/reviews${qs}`);
}

export async function updateReviewStatus(reviewId: string, status: string): Promise<Review> {
  return adminFetch(`/api/v1/admin/reviews/${reviewId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
