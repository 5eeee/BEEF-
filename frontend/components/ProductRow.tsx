"use client";

import ProductImage from "@/components/ProductImage";
import type { Product } from "@/lib/types";

const TAG_LABELS: Record<string, string> = {
  spicy: "Острое",
  vegetarian: "Вегги",
  new: "Новинка",
};

type Props = {
  product: Product;
  onSelect: (product: Product) => void;
};

export default function ProductRow({ product, onSelect }: Props) {
  const price = Number(product.price).toLocaleString("ru-RU");

  return (
    <article className="eda-row group">
      <button type="button" className="eda-row__main" onClick={() => onSelect(product)}>
        <div className="eda-row__media">
          {product.image_url ? (
            <ProductImage
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="eda-row__placeholder" aria-hidden>
              🍔
            </div>
          )}
        </div>

        <div className="eda-row__body">
          <div className="eda-row__tags">
            {product.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="eda-row__tag">
                {TAG_LABELS[tag] || tag}
              </span>
            ))}
          </div>
          <h3 className="eda-row__title">{product.name}</h3>
          {product.description && <p className="eda-row__desc">{product.description}</p>}
          {product.weight_grams ? (
            <p className="eda-row__meta">{product.weight_grams} г</p>
          ) : null}
        </div>
      </button>

      <div className="eda-row__side">
        <span className="eda-row__price">{price} ₽</span>
        <button
          type="button"
          className="eda-row__add"
          aria-label={`Добавить ${product.name}`}
          onClick={() => onSelect(product)}
        >
          +
        </button>
      </div>
    </article>
  );
}
