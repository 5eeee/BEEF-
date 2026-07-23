"use client";

import type { Campaign } from "@/lib/types";

export default function PromoBanner({ campaigns }: { campaigns: Campaign[] }) {
  if (!campaigns.length) return null;
  return (
    <div className="eda-promos">
      {campaigns.map((c) => (
        <div key={c.code} className="eda-promo">
          <p className="eda-promo__title">{c.title}</p>
          <p className="eda-promo__desc">{c.description}</p>
          <span className="eda-promo__code">{c.code}</span>
        </div>
      ))}
    </div>
  );
}
