"use client";

import { useEffect, useRef, useState } from "react";
import { useUiPrefs } from "@/components/UiPrefs";
import { searchProducts } from "@/lib/api";
import type { Product } from "@/lib/types";

type Props = {
  onSelect: (product: Product) => void;
  expanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
};

export default function SearchAutocomplete({ onSelect, expanded = false, onExpand, onCollapse }: Props) {
  const { t, locale } = useUiPrefs();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setHits([]);
      return;
    }
    const timer = window.setTimeout(() => {
      searchProducts(query, true)
        .then((r) => setHits(r.hits as Product[]))
        .catch(() => setHits([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        if (!query) onCollapse?.();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onCollapse, query]);

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  const clearAndCollapse = () => {
    setQuery("");
    setHits([]);
    setOpen(false);
    onCollapse?.();
  };

  return (
    <div ref={ref} className={`eda-search-wrap ${expanded ? "is-expanded" : ""}`}>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          onExpand?.();
        }}
        onFocus={() => {
          setOpen(true);
          onExpand?.();
        }}
        placeholder={t("search")}
        className="eda-search"
        aria-label={t("search")}
      />
      {(expanded || query) && (
        <button type="button" className="eda-search__close" onClick={clearAndCollapse} aria-label={t("close")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {open && hits.length > 0 ? (
        <ul className="eda-search-panel" role="listbox">
          {hits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                className="eda-search-panel__item"
                onClick={() => {
                  onSelect(hit);
                  clearAndCollapse();
                }}
              >
                <span className="eda-search-panel__name">{hit.name}</span>
                <span className="eda-search-panel__price">
                  {Number(hit.price).toLocaleString(locale === "en" ? "en-US" : "ru-RU")} ₽
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
