"use client";

import { useState } from "react";
import type { Campaign } from "@/lib/types";

type PromoVisual = Campaign & {
  image: string;
  badge: string;
};

const FALLBACK_PROMOS: PromoVisual[] = [
  {
    code: "BEEF300",
    title: "−300 ₽",
    description: "Первый заказ",
    badge: "−300 ₽",
    image: "/images/promo/promo-card-beef.png",
  },
  {
    code: "SMASH15",
    title: "−15%",
    description: "Смэш",
    badge: "−15%",
    image: "/images/promo/promo-card-smash.png",
  },
  {
    code: "COMBO2",
    title: "×2",
    description: "Комбо",
    badge: "×2",
    image: "/images/promo/promo-card-combo.png",
  },
];

const CODE_IMAGES: Record<string, string> = {
  BEEF300: "/images/promo/promo-card-beef.png",
  SMASH15: "/images/promo/promo-card-smash.png",
  COMBO2: "/images/promo/promo-card-combo.png",
};

type Props = {
  campaigns: Campaign[];
};

export default function HomePromoScreen({ campaigns }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const promos: PromoVisual[] = (campaigns.length ? campaigns : FALLBACK_PROMOS)
    .slice(0, 3)
    .map((c, i) => {
      const fallback = FALLBACK_PROMOS[i] ?? FALLBACK_PROMOS[0];
      return {
        ...c,
        title: campaigns.length ? c.title : fallback.title,
        description: campaigns.length ? "" : fallback.description,
        badge: fallback.badge,
        image: CODE_IMAGES[c.code] || fallback.image,
      };
    });

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied((c) => (c === code ? null : c)), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <section id="promo" className="home-promo" aria-labelledby="home-promo-title">
      <div className="home-promo__inner">
        <header className="home-promo__head">
          <p className="home-promo__eyebrow">Промокоды</p>
          <h2 id="home-promo-title" className="home-promo__title">
            Жми — копируется
          </h2>
        </header>

        <ul className="home-promo__grid">
          {promos.map((c) => (
            <li key={c.code}>
              <button
                type="button"
                className={`home-promo__card ${copied === c.code ? "is-copied" : ""}`}
                onClick={() => copyCode(c.code)}
                aria-label={`Скопировать промокод ${c.code}`}
              >
                <span className="home-promo__card-media" aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt="" loading="lazy" />
                  <span className="home-promo__badge">{c.badge}</span>
                </span>
                <span className="home-promo__card-foot">
                  <span className="home-promo__code">{c.code}</span>
                  <span className="home-promo__hint">{copied === c.code ? "Скопировано" : "Копировать"}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <a href="#menu-grid" className="home-promo__cta">
          К меню
        </a>
      </div>
    </section>
  );
}
