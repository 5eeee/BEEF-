"use client";

import { useEffect, useRef, useState } from "react";
import { useUiPrefs } from "@/components/UiPrefs";
import { searchProducts } from "@/lib/api";
import type { Product } from "@/lib/types";

type Props = {
  onSelect: (product: Product) => void;
};

export default function SearchAutocomplete({ onSelect }: Props) {
  const { t } = useUiPrefs();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(() => {
      searchProducts(query, true)
        .then((r) => setHits(r.hits as Product[]))
        .catch(() => setHits([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={t("search")}
        className="eda-search"
      />
      {open && hits.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-lg">
          {hits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-cream"
                onClick={() => {
                  onSelect(hit);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <span className="font-medium">{hit.name}</span>
                <span className="text-sm text-terracotta">
                  {Number(hit.price).toLocaleString("ru-RU")} ₽
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
