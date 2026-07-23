"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCart, removeCartItem, updateCartItem } from "@/lib/api";
import type { Cart } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CartDrawer({ open, onClose }: Props) {
  const [cart, setCart] = useState<Cart | null>(null);

  const load = () => {
    fetchCart()
      .then(setCart)
      .catch(() => setCart(null));
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, []);

  const updateQty = async (productId: string, quantity: number) => {
    const updated = await updateCartItem(productId, quantity);
    setCart(updated);
    window.dispatchEvent(new Event("cart-updated"));
  };

  const remove = async (productId: string) => {
    const updated = await removeCartItem(productId);
    setCart(updated);
    window.dispatchEvent(new Event("cart-updated"));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-bold">Корзина</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {!cart?.items.length ? (
            <p className="py-12 text-center text-muted">Корзина пуста</p>
          ) : (
            <ul className="space-y-4">
              {cart.items.map((item) => (
                <li key={item.product_id} className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream">
                    {item.image_url && (
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-terracotta">
                      {Number(item.unit_price).toLocaleString("ru-RU")} ₽
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQty(item.product_id, item.quantity - 1)}
                        className="h-7 w-7 rounded-full bg-cream text-sm font-bold"
                      >
                        −
                      </button>
                      <span className="text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.product_id, item.quantity + 1)}
                        className="h-7 w-7 rounded-full bg-cream text-sm font-bold"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item.product_id)}
                        className="ml-auto text-xs text-muted hover:text-red-600"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {cart && cart.items.length > 0 && (
          <div className="space-y-3 border-t p-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Итого</span>
              <span>{Number(cart.subtotal).toLocaleString("ru-RU")} ₽</span>
            </div>
            <Link
              href="/cart"
              onClick={onClose}
              className="block w-full rounded-2xl border border-terracotta py-3 text-center font-semibold text-terracotta"
            >
              Перейти в корзину
            </Link>
            <Link
              href="/checkout"
              onClick={onClose}
              className="block w-full rounded-2xl bg-terracotta py-3 text-center font-semibold text-white"
            >
              Оформить заказ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
