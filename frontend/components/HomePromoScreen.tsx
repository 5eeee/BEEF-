"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUiPrefs } from "@/components/UiPrefs";
import type { Campaign } from "@/lib/types";

type PromoVisual = {
  code: string;
  title: string;
  description: string;
  badge: string;
  image: string;
};

type Props = {
  campaigns: Campaign[];
};

/** Each promo gets a distinct colorful burger photo. */
const PROMO_VISUALS: Omit<PromoVisual, "title" | "description">[] = [
  {
    code: "WELCOME10",
    badge: "−10%",
    image: "/images/promo/promo-burger-classic.png",
  },
  {
    code: "BEEF200",
    badge: "−200 ₽",
    image: "/images/promo/promo-card-beef.png",
  },
  {
    code: "SMASH15",
    badge: "−15%",
    image: "/images/promo/promo-burger-smash.png",
  },
  {
    code: "COMBO2",
    badge: "×2",
    image: "/images/promo/promo-burger-combo.png",
  },
  {
    code: "SPICY10",
    badge: "−10%",
    image: "/images/promo/promo-burger-spicy.png",
  },
  {
    code: "DOUBLE20",
    badge: "−20%",
    image: "/images/promo/promo-burger-double.png",
  },
];

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      {dir === "prev" ? (
        <path d="M14.5 5.5 8 12l6.5 6.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M9.5 5.5 16 12l-6.5 6.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export default function HomePromoScreen({ campaigns }: Props) {
  const { t } = useUiPrefs();
  const [copied, setCopied] = useState<string | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const scrollRef = useRef<HTMLUListElement>(null);

  const labels = useMemo(
    () =>
      ({
        WELCOME10: { title: "−10%", description: t("promoFirstOrder") },
        BEEF200: { title: "−200 ₽", description: t("promoFixed200") },
        SMASH15: { title: "−15%", description: t("promoSmash") },
        COMBO2: { title: "×2", description: t("promoCombo") },
        SPICY10: { title: "−10%", description: t("promoSpicy") },
        DOUBLE20: { title: "−20%", description: t("promoDouble") },
      }) as Record<string, { title: string; description: string }>,
    [t]
  );

  const promos: PromoVisual[] = useMemo(() => {
    const byCode = new Map(campaigns.map((c) => [c.code.toUpperCase(), c]));

    const fromVisuals = PROMO_VISUALS.map((v) => {
      const api = byCode.get(v.code);
      const fallback = labels[v.code];
      return {
        ...v,
        title: fallback?.title || api?.title || v.badge,
        description: fallback?.description || api?.description || v.code,
      };
    });

    for (const c of campaigns) {
      if (PROMO_VISUALS.some((v) => v.code === c.code.toUpperCase())) continue;
      fromVisuals.push({
        code: c.code,
        title: c.title,
        description: c.description || c.title,
        badge: c.title.slice(0, 8),
        image: "/images/promo/promo-card-combo.png",
      });
    }

    return fromVisuals;
  }, [campaigns, labels]);

  const syncArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < max - 8);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    syncArrows();
    el.addEventListener("scroll", syncArrows, { passive: true });
    window.addEventListener("resize", syncArrows);
    return () => {
      el.removeEventListener("scroll", syncArrows);
      window.removeEventListener("resize", syncArrows);
    };
  }, [promos.length]);

  const scrollByCard = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("li");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.7;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

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
          <h2 id="home-promo-title" className="home-promo__title">
            {t("promotions")}
          </h2>
        </header>

        <div className="home-promo__rail">
          <button
            type="button"
            className="home-promo__nav home-promo__nav--prev"
            onClick={() => scrollByCard(-1)}
            disabled={!canPrev}
            aria-label="Previous"
          >
            <Chevron dir="prev" />
          </button>

          <ul ref={scrollRef} className="home-promo__scroll">
            {promos.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  className={`home-promo__card ${copied === c.code ? "is-copied" : ""}`}
                  onClick={() => copyCode(c.code)}
                  aria-label={`${t("copyPromoAria")} ${c.code}`}
                >
                  <span className="home-promo__card-media" aria-hidden>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image} alt="" loading="lazy" />
                    <span className="home-promo__badge">{c.badge}</span>
                  </span>
                  <span className="home-promo__card-foot">
                    <span className="home-promo__code">{c.description}</span>
                    <span className="home-promo__hint">
                      {copied === c.code ? t("copied") : `${t("copyCode")} · ${c.code}`}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="home-promo__nav home-promo__nav--next"
            onClick={() => scrollByCard(1)}
            disabled={!canNext}
            aria-label="Next"
          >
            <Chevron dir="next" />
          </button>
        </div>

        <a href="#menu-grid" className="home-promo__cta">
          {t("goToMenu")}
        </a>
      </div>
    </section>
  );
}
