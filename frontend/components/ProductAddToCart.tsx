"use client";

import { useState } from "react";
import { addToCart } from "@/lib/api";
import type { Product } from "@/lib/types";

type Props = {
  product: Product;
};

export default function ProductAddToCart({ product }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    setError("");
    try {
      await addToCart(product.id, quantity);
      window.dispatchEvent(new Event("cart-updated"));
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось добавить");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-terracotta">
          {Number(product.price).toLocaleString("ru-RU")} ₽
        </span>
        <div className="flex items-center gap-3 rounded-full bg-cream px-2 py-1">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="h-8 w-8 rounded-full bg-white text-lg font-bold"
            aria-label="Уменьшить количество"
          >
            −
          </button>
          <span className="w-6 text-center font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            className="h-8 w-8 rounded-full bg-white text-lg font-bold"
            aria-label="Увеличить количество"
          >
            +
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleAdd}
        disabled={loading || !product.is_available}
        className="w-full rounded-2xl bg-terracotta py-4 text-lg font-semibold text-white transition hover:bg-terracotta-dark disabled:opacity-60"
      >
        {loading ? "Добавляем…" : added ? "Добавлено ✓" : "В корзину"}
      </button>
    </div>
  );
}
