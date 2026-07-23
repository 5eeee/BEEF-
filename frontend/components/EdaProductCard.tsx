"use client";

import { useEffect, useState } from "react";
import ProductImage from "@/components/ProductImage";
import { TagGlyph } from "@/components/TagIcon";
import { addToCart, removeCartItem, updateCartItem } from "@/lib/api";
import { flyToCart } from "@/lib/flyToCart";
import type { Product } from "@/lib/types";

type Props = {
  product: Product;
  qty: number;
  onSelect: (product: Product) => void;
};

function TagBadge({ tag }: { tag: string }) {
  if (tag === "spicy") {
    return (
      <span className="ye-card__chip ye-card__chip--spicy" title="Острое" aria-label="Острое">
        <TagGlyph kind="spicy" />
      </span>
    );
  }
  if (tag === "vegetarian") {
    return (
      <span className="ye-card__chip ye-card__chip--veg" title="Вегетарианское" aria-label="Вегетарианское">
        <TagGlyph kind="vegetarian" />
      </span>
    );
  }
  if (tag === "new") {
    return (
      <span className="ye-card__chip ye-card__chip--new" title="Новинка" aria-label="Новинка">
        <TagGlyph kind="new" />
      </span>
    );
  }
  return null;
}

export default function EdaProductCard({ product, qty, onSelect }: Props) {
  const [busy, setBusy] = useState(false);
  const [localQty, setLocalQty] = useState(qty);

  useEffect(() => {
    setLocalQty(qty);
  }, [qty]);

  const price = Number(product.price).toLocaleString("ru-RU");
  const meta = [
    product.weight_grams ? `${product.weight_grams} г` : null,
    product.calories ? `${product.calories} ккал` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const tags = product.tags?.length
    ? product.tags
    : /остр|халап|чили|spicy/i.test(`${product.name} ${product.description || ""}`)
      ? ["spicy"]
      : [];

  const syncCart = () => window.dispatchEvent(new Event("cart-updated"));

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const media = (e.currentTarget as HTMLElement).closest(".ye-card__media") as HTMLElement | null;
    flyToCart(media, product.image_url);
    setBusy(true);
    setLocalQty(1);
    try {
      await addToCart(product.id, 1);
      syncCart();
    } catch {
      setLocalQty(0);
    } finally {
      setBusy(false);
    }
  };

  const handleInc = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const media = (e.currentTarget as HTMLElement).closest(".ye-card__media") as HTMLElement | null;
    flyToCart(media, product.image_url);
    const next = localQty + 1;
    setBusy(true);
    setLocalQty(next);
    try {
      await updateCartItem(product.id, next);
      syncCart();
    } catch {
      setLocalQty(localQty);
    } finally {
      setBusy(false);
    }
  };

  const handleDec = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const next = localQty - 1;
    setBusy(true);
    setLocalQty(Math.max(0, next));
    try {
      if (next <= 0) await removeCartItem(product.id);
      else await updateCartItem(product.id, next);
      syncCart();
    } catch {
      setLocalQty(localQty);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="ye-card">
      <div className="ye-card__media">
        <button type="button" className="ye-card__photo" onClick={() => onSelect(product)} aria-label={product.name}>
          {product.image_url ? (
            <ProductImage
              src={product.image_url}
              alt=""
              fill
              className="object-contain p-[8%]"
              sizes="(max-width: 900px) 50vw, 280px"
            />
          ) : (
            <div className="ye-card__ph" aria-hidden>
              🍔
            </div>
          )}
        </button>

        {tags.length > 0 ? (
          <div className="ye-card__chips">
            {tags.map((t) => (
              <TagBadge key={t} tag={t} />
            ))}
          </div>
        ) : null}

        {localQty > 0 ? (
          <div className="ye-card__qty" role="group" aria-label="Количество в корзине">
            <button type="button" className="ye-card__qty-btn" onClick={handleDec} disabled={busy} aria-label="Убавить">
              −
            </button>
            <span className="ye-card__qty-val">{localQty}</span>
            <button type="button" className="ye-card__qty-btn" onClick={handleInc} disabled={busy} aria-label="Добавить">
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`ye-card__add ${busy ? "is-busy" : ""}`}
            onClick={handleAdd}
            disabled={busy}
            aria-label="Добавить в корзину"
          >
            <span aria-hidden>{busy ? "…" : "+"}</span>
          </button>
        )}
      </div>
      <button type="button" className="ye-card__body" onClick={() => onSelect(product)}>
        <p className="ye-card__price">{price} ₽</p>
        <h3 className="ye-card__title">{product.name}</h3>
        {meta ? <p className="ye-card__meta">{meta}</p> : null}
      </button>
    </article>
  );
}
