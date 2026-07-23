"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function scrollToCategory(slug: string | null) {
  if (!slug) {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const el = document.getElementById(`cat-${slug}`);
  if (!el) return;
  const headerOffset = 108;
  const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
  window.scrollTo({ top, behavior: "smooth" });
}

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
  const [catsStuck, setCatsStuck] = useState(false);
  const catsSentinelRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const sentinel = catsSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCatsStuck(!entry.isIntersecting),
      { root: null, threshold: 0, rootMargin: "-4.25rem 0px 0px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const sections = useMemo(() => {
    const byCat = new Map<string, Product[]>();
    for (const p of products) {
      const list = byCat.get(p.category_slug) ?? [];
      list.push(p);
      byCat.set(p.category_slug, list);
    }
    return categories
      .filter((c) => byCat.has(c.slug))
      .map((c) => ({ slug: c.slug, title: c.name, items: byCat.get(c.slug)! }));
  }, [products, categories]);

  useEffect(() => {
    if (loading || sections.length === 0) return;

    const nodes = sections
      .map((s) => document.getElementById(`cat-${s.slug}`))
      .filter((n): n is HTMLElement => Boolean(n));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (!top?.target?.id) return;
        const slug = top.target.id.replace(/^cat-/, "");
        onCategoryChange(slug);
      },
      { root: null, rootMargin: "-25% 0px -55% 0px", threshold: [0.15, 0.35, 0.55] }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [loading, sections, onCategoryChange]);

  const selectCategory = (slug: string | null) => {
    onCategoryChange(slug);
    scrollToCategory(slug);
  };

  return (
    <div className="ye ye--split">
      <aside className="ye-panel ye-cats" aria-label="Категории">
        <p className="ye-cats__heading">Категории</p>
        <button
          type="button"
          className={`ye-cats__item ${category === null ? "is-active" : ""}`}
          onClick={() => selectCategory(null)}
        >
          Все
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            className={`ye-cats__item ${category === cat.slug ? "is-active" : ""}`}
            onClick={() => selectCategory(cat.slug)}
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

      <div ref={catsSentinelRef} className="ye-cats-mobile-sentinel" aria-hidden />
      <div
        className={`ye-panel ye-cats-mobile ${catsStuck ? "is-stuck" : ""}`}
        aria-label="Категории"
      >
        <button
          type="button"
          className={`ye-cats-mobile__item ${category === null ? "is-active" : ""}`}
          onClick={() => selectCategory(null)}
        >
          Все
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            className={`ye-cats-mobile__item ${category === cat.slug ? "is-active" : ""}`}
            onClick={() => selectCategory(cat.slug)}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
