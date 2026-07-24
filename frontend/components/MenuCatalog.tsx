"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import EdaProductCard from "@/components/EdaProductCard";
import { TagIcon } from "@/components/TagIcon";
import { useUiPrefs } from "@/components/UiPrefs";
import { fetchCart } from "@/lib/api";
import type { Category, Product } from "@/lib/types";

type Props = {
  categories: Category[];
  products: Product[];
  category: string | null;
  tags: string[];
  sort: string;
  loading: boolean;
  filtering?: boolean;
  onCategoryChange: (slug: string | null) => void;
  onTagToggle: (tag: string) => void;
  onSortChange: (sort: string) => void;
  onProductSelect: (product: Product) => void;
};

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
  filtering = false,
  onCategoryChange,
  onTagToggle,
  onSortChange,
  onProductSelect,
}: Props) {
  const { t } = useUiPrefs();
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [catsStuck, setCatsStuck] = useState(false);
  const catsSentinelRef = useRef<HTMLDivElement>(null);
  const mobileCatsRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef(category);
  const lockSpyUntil = useRef(0);
  const userPickRef = useRef(false);

  const TAGS = useMemo(
    () =>
      [
        { id: "spicy", label: t("tagSpicy") },
        { id: "vegetarian", label: t("tagVeg") },
        { id: "new", label: t("tagNew") },
      ] as const,
    [t]
  );

  const SORTS = useMemo(
    () =>
      [
        { id: "popularity", label: t("sortPopular") },
        { id: "price_asc", label: t("sortCheap") },
        { id: "price_desc", label: t("sortExpensive") },
      ] as const,
    [t]
  );

  useEffect(() => {
    categoryRef.current = category;
  }, [category]);

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
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    let observer: IntersectionObserver;
    try {
      observer = new IntersectionObserver(
        ([entry]) => setCatsStuck(!entry.isIntersecting),
        { root: null, threshold: 0, rootMargin: "-68px 0px 0px 0px" }
      );
    } catch {
      return;
    }
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

    let frame = 0;
    const syncActiveCategory = () => {
      if (Date.now() < lockSpyUntil.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nodes = sections
          .map((section) => ({ slug: section.slug, node: document.getElementById(`cat-${section.slug}`) }))
          .filter((section): section is { slug: string; node: HTMLElement } => Boolean(section.node));
        if (!nodes.length) return;

        const headerBottom = document.querySelector<HTMLElement>(".header-shell")?.getBoundingClientRect().bottom ?? 0;
        const referenceLine = Math.max(16, headerBottom + 18);
        const current = categoryRef.current;
        if (nodes[0].node.getBoundingClientRect().top > referenceLine) {
          if (current !== null) onCategoryChange(null);
          return;
        }

        const active = nodes.reduce(
          (closest, section) => (section.node.getBoundingClientRect().top <= referenceLine ? section : closest),
          nodes[0]
        );
        if (active.slug !== current) onCategoryChange(active.slug);
      });
    };

    syncActiveCategory();
    window.addEventListener("scroll", syncActiveCategory, { passive: true });
    window.addEventListener("resize", syncActiveCategory);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", syncActiveCategory);
      window.removeEventListener("resize", syncActiveCategory);
    };
  }, [loading, sections, onCategoryChange]);

  useEffect(() => {
    if (!userPickRef.current) return;
    userPickRef.current = false;
    const activeButton = mobileCatsRef.current?.querySelector<HTMLElement>(
      `[data-category="${category ?? "all"}"]`
    );
    activeButton?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [category]);

  const selectCategory = (slug: string | null) => {
    userPickRef.current = true;
    lockSpyUntil.current = Date.now() + 700;
    onCategoryChange(slug);
    scrollToCategory(slug);
  };

  return (
    <div className={`ye ye--split ${filtering ? "is-filtering" : ""}`}>
      <aside className="ye-panel ye-cats" aria-label={t("categories")}>
        <p className="ye-cats__heading">{t("categories")}</p>
        <button
          type="button"
          className={`ye-cats__item ${category === null ? "is-active" : ""}`}
          onClick={() => selectCategory(null)}
        >
          {t("all")}
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
          <p className="ye-empty">{t("loadingMenu")}</p>
        ) : products.length === 0 ? (
          <p className="ye-empty">{t("nothingFound")}</p>
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

      <aside className="ye-panel ye-filters-panel" aria-label={t("filters")}>
        <h3 className="ye-filters-panel__title">{t("filters")}</h3>

        <div className="ye-filters-panel__block">
          <p className="ye-filters-panel__label">{t("sorting")}</p>
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
          <p className="ye-filters-panel__label">{t("features")}</p>
          <div className="ye-filters-panel__list">
            {TAGS.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={`ye-filters-panel__opt ye-filters-panel__opt--tag ${tags.includes(tag.id) ? "is-active" : ""}`}
                onClick={() => onTagToggle(tag.id)}
              >
                <TagIcon kind={tag.id} />
                <span>{tag.label}</span>
              </button>
            ))}
          </div>
        </div>

        {(tags.length > 0 || sort !== "popularity") && (
          <button
            type="button"
            className="ye-filters-panel__reset"
            onClick={() => {
              tags.forEach((tag) => onTagToggle(tag));
              onSortChange("popularity");
            }}
          >
            {t("reset")}
          </button>
        )}
      </aside>

      <div ref={catsSentinelRef} className="ye-cats-mobile-sentinel" aria-hidden />
      <div
        ref={mobileCatsRef}
        className={`ye-panel ye-cats-mobile ${catsStuck ? "is-stuck" : ""}`}
        aria-label={t("categories")}
      >
        <button
          type="button"
          data-category="all"
          className={`ye-cats-mobile__item ${category === null ? "is-active" : ""}`}
          onClick={() => selectCategory(null)}
        >
          {t("all")}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            data-category={cat.slug}
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
