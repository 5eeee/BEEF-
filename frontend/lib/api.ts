import { API_URL } from "./types";
import type {
  BlogPost,
  BlogPostList,
  Campaign,
  Cart,
  Category,
  CompanyInfo,
  Order,
  PaymentInitResponse,
  Product,
  ProductList,
  ReviewList,
  SavedAddress,
} from "./types";
import { getAuthHeaders } from "./auth";
import { getSessionId } from "./session";

const MOCK_ORDERS_KEY = "beefshteks_mock_orders";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("X-Session-Id", getSessionId());
  const auth = getAuthHeaders();
  Object.entries(auth).forEach(([k, v]) => {
    if (!headers.has(k)) headers.set(k, v);
  });

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

function getMockOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(MOCK_ORDERS_KEY) || "[]") as Order[];
  } catch {
    return [];
  }
}

function saveMockOrder(order: Order): void {
  const orders = getMockOrders().filter((o) => o.id !== order.id);
  orders.unshift(order);
  localStorage.setItem(MOCK_ORDERS_KEY, JSON.stringify(orders.slice(0, 20)));
}

export async function fetchCategories(): Promise<Category[]> {
  return apiFetch("/api/v1/categories");
}

export async function fetchProducts(params: Record<string, string> = {}): Promise<ProductList> {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/api/v1/products${qs ? `?${qs}` : ""}`);
}

export async function fetchProduct(id: string): Promise<Product> {
  return apiFetch(`/api/v1/products/${id}`);
}

export async function searchProducts(q: string, autocomplete = false) {
  const qs = new URLSearchParams({ q, autocomplete: String(autocomplete) });
  return apiFetch<{ hits: Product[]; total: number }>(`/api/v1/search?${qs}`);

}

export async function fetchCart(): Promise<Cart> {
  return apiFetch("/api/v1/cart");
}

export async function addToCart(productId: string, quantity: number): Promise<Cart> {
  return apiFetch("/api/v1/cart/items", {
    method: "POST",
    body: JSON.stringify({ product_id: productId, quantity }),
  });
}

export async function updateCartItem(productId: string, quantity: number): Promise<Cart> {
  return apiFetch(`/api/v1/cart/items/${productId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(productId: string): Promise<Cart> {
  return apiFetch(`/api/v1/cart/items/${productId}`, { method: "DELETE" });
}

export async function applyPromo(promoCode: string) {
  return apiFetch<{ promo_code: string; discount: string; subtotal: string; total: string }>(
    "/api/v1/cart/promo",
    { method: "POST", body: JSON.stringify({ promo_code: promoCode }) }
  );
}

export async function checkout(data: Record<string, unknown>): Promise<Order> {
  try {
    const order = await apiFetch<Order>("/api/v1/orders/checkout", {
      method: "POST",
      body: JSON.stringify(data),
    });
    saveMockOrder(order);
    return order;
  } catch (err) {
    const mock: Order = {
      id: `ord-${Date.now()}`,
      order_number: `BS-${Math.floor(100000 + Math.random() * 900000)}`,
      status: "pending",
      delivery_type: String(data.delivery_type || "delivery"),
      customer_name: String(data.customer_name || ""),
      customer_phone: String(data.customer_phone || ""),
      delivery_address: data.delivery_address ? String(data.delivery_address) : undefined,
      comment: data.comment ? String(data.comment) : undefined,
      subtotal: "0",
      delivery_fee: data.delivery_type === "pickup" ? "0" : "199",
      discount: "0",
      total: "0",
      promo_code: data.promo_code ? String(data.promo_code) : undefined,
      items: [],
      created_at: new Date().toISOString(),
    };
    saveMockOrder(mock);
    return mock;
  }
}

export async function fetchOrder(id: string): Promise<Order> {
  try {
    return await apiFetch(`/api/v1/orders/${id}`);
  } catch {
    const found = getMockOrders().find((o) => o.id === id);
    if (found) return found;
    throw new Error("Заказ не найден");
  }
}

export async function fetchUserOrders(userId: string): Promise<Order[]> {
  try {
    return await apiFetch(`/api/v1/orders/user/${userId}`);
  } catch {
    return getMockOrders();
  }
}

export async function fetchUserAddresses(): Promise<SavedAddress[]> {
  try {
    return await apiFetch("/api/v1/users/me/addresses");
  } catch {
    return [];
  }
}

export async function initPayment(
  orderId: string,
  paymentMethod: string
): Promise<PaymentInitResponse> {
  try {
    return await apiFetch("/api/v1/payments/init", {
      method: "POST",
      body: JSON.stringify({ order_id: orderId, payment_method: paymentMethod }),
    });
  } catch {
    return {
      payment_id: `pay-${orderId}`,
      status: "pending",
    };
  }
}

export async function confirmPaymentMock(paymentId: string, orderId: string): Promise<Order> {
  try {
    await apiFetch("/api/v1/payments/webhook", {
      method: "POST",
      body: JSON.stringify({ payment_id: paymentId, status: "succeeded" }),
    });
  } catch {
    /* mock path */
  }
  const orders = getMockOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    orders[idx] = { ...orders[idx], status: "paid", payment_method: "card" };
    localStorage.setItem(MOCK_ORDERS_KEY, JSON.stringify(orders));
    return orders[idx];
  }
  try {
    const order = await fetchOrder(orderId);
    return { ...order, status: "paid" };
  } catch {
    return {
      id: orderId,
      order_number: paymentId,
      status: "paid",
      delivery_type: "delivery",
      customer_name: "",
      customer_phone: "",
      subtotal: "0",
      delivery_fee: "0",
      discount: "0",
      total: "0",
      items: [],
      created_at: new Date().toISOString(),
    };
  }
}

export async function fetchActivePromos(): Promise<Campaign[]> {
  return apiFetch("/api/v1/promo/active");
}

export async function suggestAddress(query: string): Promise<string[]> {
  try {
    const res = await apiFetch<{ suggestions: string[] }>("/api/v1/delivery/geocode/suggest", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
    return res.suggestions;
  } catch {
    return [];
  }
}

export async function fetchReviews(limit = 5): Promise<ReviewList> {
  return apiFetch(`/api/v1/reviews?page_size=${limit}`);
}

export async function fetchBlogPosts(limit = 2): Promise<BlogPostList> {
  return apiFetch(`/api/v1/blog?limit=${limit}`);
}

export async function fetchBlogPost(slug: string): Promise<BlogPost> {
  return apiFetch(`/api/v1/blog/${slug}`);
}

export async function fetchCompanyInfo(): Promise<CompanyInfo> {
  return apiFetch("/api/v1/company");
}

export async function subscribePush(subscription: PushSubscriptionJSON): Promise<{ ok: boolean }> {
  try {
    return await apiFetch("/api/v1/notifications/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
    });
  } catch {
    return { ok: true };
  }
}
