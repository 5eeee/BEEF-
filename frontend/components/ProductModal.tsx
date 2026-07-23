"use client";

import { useEffect, useState } from "react";
import { TagGlyph } from "@/components/TagIcon";
import { addToCart } from "@/lib/api";
import type { Product } from "@/lib/types";

type Props = {
  product: Product | null;
  onClose: () => void;
};

export default function ProductModal({ product, onClose }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setQuantity(1);
    setError("");
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (sbw > 0) {
      document.body.style.paddingRight = `${sbw}px`;
      document.documentElement.style.setProperty("--scroll-lock-pad", `${sbw}px`);
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
      document.documentElement.style.removeProperty("--scroll-lock-pad");
      window.removeEventListener("keydown", onKey);
    };
  }, [product, onClose]);

  if (!product) return null;

  const price = Number(product.price).toLocaleString("ru-RU");
  const weight = product.weight_grams ? `${product.weight_grams} г` : null;
  const tags = Array.isArray(product.tags) ? product.tags : [];
  const isSpicy =
    tags.includes("spicy") ||
    /остр|халап|чили|spicy/i.test(`${product.name} ${product.description || ""}`);

  const handleAdd = async () => {
    setLoading(true);
    setError("");
    try {
      await addToCart(product.id, quantity);
      window.dispatchEvent(new Event("cart-updated"));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось добавить");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pm-overlay" role="dialog" aria-modal="true" aria-label={product.name}>
      <button type="button" className="pm-overlay__backdrop" aria-label="Закрыть" onClick={onClose} />
      <div className="pm">
        <button type="button" className="pm__close" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>

        <div className="pm__media">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name} className="pm__img" />
          ) : (
            <div className="pm__ph" aria-hidden>
              🍔
            </div>
          )}
          {isSpicy ? (
            <span className="pm__chip pm__chip--spicy" title="Острое" aria-label="Острое">
              <TagGlyph kind="spicy" />
            </span>
          ) : null}
        </div>

        <div className="pm__body">
          <div className="pm__head">
            <h2 className="pm__title">
              {product.name}
              {weight ? <span className="pm__weight"> {weight}</span> : null}
            </h2>
          </div>

          <div className="pm__row">
            <p className="pm__price">{price} ₽</p>
            <div className="pm__qty" aria-label="Количество">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Меньше">
                −
              </button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((q) => Math.min(99, q + 1))} aria-label="Больше">
                +
              </button>
            </div>
            <button type="button" className="pm__add" onClick={handleAdd} disabled={loading}>
              {loading ? "…" : "Добавить"}
            </button>
          </div>

          {product.description ? <p className="pm__desc">{product.description}</p> : null}
          {error ? <p className="pm__error">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
