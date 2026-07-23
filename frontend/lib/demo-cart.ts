import { FALLBACK_PRODUCTS, findFallbackProduct } from "@/lib/fallback-catalog";
import type { Cart, CartItem } from "@/lib/types";

const DEMO_CART_KEY = "beefshteks_demo_cart";

function money(n: number): string {
  return n.toFixed(2);
}

function emptyCart(): Cart {
  return {
    session_id: "demo",
    items: [],
    subtotal: "0.00",
    item_count: 0,
  };
}

function recalc(items: CartItem[]): Cart {
  const subtotal = items.reduce((s, i) => s + Number(i.line_total), 0);
  const item_count = items.reduce((s, i) => s + i.quantity, 0);
  return {
    session_id: "demo",
    items,
    subtotal: money(subtotal),
    item_count,
  };
}

export function readDemoCart(): Cart {
  if (typeof window === "undefined") return emptyCart();
  try {
    const raw = localStorage.getItem(DEMO_CART_KEY);
    if (!raw) return emptyCart();
    const parsed = JSON.parse(raw) as Cart;
    return recalc(parsed.items || []);
  } catch {
    return emptyCart();
  }
}

function writeDemoCart(cart: Cart): Cart {
  const next = recalc(cart.items);
  if (typeof window !== "undefined") {
    localStorage.setItem(DEMO_CART_KEY, JSON.stringify(next));
  }
  return next;
}

export function demoAddToCart(productId: string, quantity: number): Cart {
  const product =
    findFallbackProduct(productId) ||
    FALLBACK_PRODUCTS.find((p) => p.id === productId);
  const cart = readDemoCart();
  if (!product) return cart;

  const items = [...cart.items];
  const idx = items.findIndex((i) => i.product_id === product.id);
  const qty = Math.max(1, quantity);
  if (idx >= 0) {
    const nextQty = items[idx].quantity + qty;
    items[idx] = {
      ...items[idx],
      quantity: nextQty,
      line_total: money(Number(product.price) * nextQty),
    };
  } else {
    items.push({
      product_id: product.id,
      product_slug: product.slug,
      name: product.name,
      unit_price: product.price,
      quantity: qty,
      image_url: product.image_url,
      line_total: money(Number(product.price) * qty),
    });
  }
  return writeDemoCart({ ...cart, items });
}

export function demoUpdateCartItem(productId: string, quantity: number): Cart {
  const cart = readDemoCart();
  if (quantity <= 0) return demoRemoveCartItem(productId);
  const items = cart.items.map((i) => {
    if (i.product_id !== productId) return i;
    return {
      ...i,
      quantity,
      line_total: money(Number(i.unit_price) * quantity),
    };
  });
  return writeDemoCart({ ...cart, items });
}

export function demoRemoveCartItem(productId: string): Cart {
  const cart = readDemoCart();
  return writeDemoCart({
    ...cart,
    items: cart.items.filter((i) => i.product_id !== productId),
  });
}

export function demoClearCart(): Cart {
  return writeDemoCart(emptyCart());
}
