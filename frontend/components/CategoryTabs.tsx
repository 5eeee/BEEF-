"use client";

import type { Category } from "@/lib/types";

type Props = {
  categories: Category[];
  active: string | null;
  onChange: (slug: string | null) => void;
};

export default function CategoryTabs({ categories, active, onChange }: Props) {
  return (
    <div className="eda-tabs" role="tablist" aria-label="Категории">
      <button
        type="button"
        role="tab"
        aria-selected={active === null}
        onClick={() => onChange(null)}
        className={`eda-tab ${active === null ? "is-active" : ""}`}
      >
        Все
      </button>
      {categories.map((cat) => (
        <button
          key={cat.slug}
          type="button"
          role="tab"
          aria-selected={active === cat.slug}
          onClick={() => onChange(cat.slug)}
          className={`eda-tab ${active === cat.slug ? "is-active" : ""}`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
