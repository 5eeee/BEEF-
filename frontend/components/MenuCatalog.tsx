"use client";

import { useEffect, useMemo, useState } from "react";
import EdaProductCard from "@/components/EdaProductCard";
import { TagIcon } from "@/components/TagIcon";
import { fetchCart } from "@/lib/api";
import type { Category, Product } from "@/lib/types";

type Props = {
  categories: Category[];
  products: Product[];
  category: string | null;
  tags: string[];
  sort: string;
  loading: boolean;
  onCategoryChange: (slug: string | null) => void;
  onTagToggle: (tag: string) => void;
  onSortChange: (sort: string) => void;
  onProductSelect: (product: Product) => void;
};

const TAGS = [
  { id: "spicy", label: "Острое" },
  { id: "vegetarian", label: "Вегги" },
  { id: "new", label: "Новинка" },
] as const;

const SORTS = [
  { id: "popularity", label: "Популярные" },
  { id: "price_asc", label: "Сначала дешевле" },
  { id: "price_desc", label: "Сначала дороже" },
] as const;

export default function MenuCatalog({
  categories,
  products,
  category,
  tags,
  sort,
  loading,
  onCategoryChange,
  onTagToggle,
  onSortChange,
  onProductSelect,
}: Props) {
  const [qtyById, setQtyById] = useState<Record<string, number>>({});

  useEffect(() => {
    const sync = () => {
      fetchCart()
        .then((cart) => {
          const next: Record<string, number> = {};
          for (const item of cart.items) next[item.product_id] = item.quantity;
          setQtyById(next);
        })
        .catch(() => {});
    };
    sync();
    window.addEventListener("cart-updated", sync);
    return () => window.removeEventListener("cart-updated", sync);
  }, []);

  const categoryName = useMemo(() => {
    if (!category) return null;
    return categories.find((c) => c.slug === category)?.name ?? category;
  }, [category, categories]);

  const sections = useMemo(() => {
    if (category) {
      return [{ slug: category, title: categoryName ?? "Меню", items: products }];
    }
    const byCat = new Map<string, Product[]>();
    for (const p of products) {
      const list = byCat.get(p.category_slug) ?? [];
      list.push(p);
      byCat.set(p.category_slug, list);
    }
    return categories
      .filter((c) => byCat.has(c.slug))
      .map((c) => ({ slug: c.slug, title: c.name, items: byCat.get(c.slug)! }));
  }, [products, category, categories, categoryName]);

  return (
    <div className="ye ye--split">
      <aside className="ye-panel ye-cats" aria-label="Категории">
        <p className="ye-cats__heading">Категории</p>
        <button
          type="button"
          className={`ye-cats__item ${category === null ? "is-active" : ""}`}
          onClick={() => onCategoryChange(null)}
        >
          Все
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            className={`ye-cats__item ${category === cat.slug ? "is-active" : ""}`}
            onClick={() => onCategoryChange(cat.slug)}
          >
            {cat.name}
          </button>
        ))}
      </aside>

      <div className="ye-panel ye-main">
        {loading ? (
          <p className="ye-empty">Загружаем меню…</p>
        ) : products.length === 0 ? (
          <p className="ye-empty">Ничего не нашли</p>
        ) : (
          <div id="menu-grid" className="ye-sections">
            {sections.map((section) => (
              <section key={section.slug} className="ye-section" id={`cat-${section.slug}`}>
                <h3 className="ye-section__title">{section.title}</h3>
                <div className="ye-grid">
                  {section.items.map((p) => (
                    <EdaProductCard
                      key={p.id}
                      product={p}
                      qty={qtyById[p.id] ?? 0}
                      onSelect={onProductSelect}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <aside className="ye-panel ye-filters-panel" aria-label="Фильтры">
        <h3 className="ye-filters-panel__title">Фильтры</h3>

        <div className="ye-filters-panel__block">
          <p className="ye-filters-panel__label">Сортировка</p>
          <div className="ye-filters-panel__list">
            {SORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`ye-filters-panel__opt ${sort === s.id ? "is-active" : ""}`}
                onClick={() => onSortChange(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ye-filters-panel__block">
          <p className="ye-filters-panel__label">Особенности</p>
          <div className="ye-filters-panel__list">
            {TAGS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`ye-filters-panel__opt ye-filters-panel__opt--tag ${tags.includes(t.id) ? "is-active" : ""}`}
                onClick={() => onTagToggle(t.id)}
              >
                <TagIcon kind={t.id} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {(tags.length > 0 || sort !== "popularity") && (
          <button
            type="button"
            className="ye-filters-panel__reset"
            onClick={() => {
              tags.forEach((t) => onTagToggle(t));
              onSortChange("popularity");
            }}
          >
            Сбросить
          </button>
        )}
      </aside>

      <div className="ye-panel ye-cats-mobile" aria-label="Категории">
        <button
          type="button"
          className={`ye-cats-mobile__item ${category === null ? "is-active" : ""}`}
          onClick={() => onCategoryChange(null)}
        >
          Все
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            className={`ye-cats-mobile__item ${category === cat.slug ? "is-active" : ""}`}
            onClick={() => onCategoryChange(cat.slug)}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
