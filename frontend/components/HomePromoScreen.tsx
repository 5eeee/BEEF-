"use client";

import { useState } from "react";
import type { Campaign } from "@/lib/types";

const FALLBACK_PROMOS: Campaign[] = [
  {
    code: "BEEF300",
    title: "Скидка на первый заказ",
    description: "300 ₽ на доставку от 1500 ₽ — укажите код в корзине",
  },
  {
    code: "SMASH15",
    title: "Смэш со скидкой",
    description: "15% на смэш-бургеры в будние дни до 16:00",
  },
  {
    code: "COMBO2",
    title: "Комбо для двоих",
    description: "Два бургера + картофель — фиксированная цена по коду",
  },
];

type Props = {
  campaigns: Campaign[];
};

export default function HomePromoScreen({ campaigns }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const promos = (campaigns.length ? campaigns : FALLBACK_PROMOS).slice(0, 3);

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
      <div className="home-promo__media" aria-hidden>
        <figure className="home-promo__shot home-promo__shot--a">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/promo/promo-smash.png" alt="" loading="lazy" />
        </figure>
        <figure className="home-promo__shot home-promo__shot--b">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/promo/promo-combo.png" alt="" loading="lazy" />
        </figure>
      </div>

      <div className="home-promo__veil" aria-hidden />

      <div className="home-promo__inner">
        <p className="home-promo__eyebrow">Акции · промокоды</p>
        <h2 id="home-promo-title" className="home-promo__title">
          Скидки с характером
        </h2>
        <p className="home-promo__lead">
          Нажмите на код — скопируется. Вставьте в корзине при оформлении. Ниже — полное меню.
        </p>

        <ul className="home-promo__list">
          {promos.map((c) => (
            <li key={c.code}>
              <button type="button" className="home-promo__deal" onClick={() => copyCode(c.code)}>
                <span className="home-promo__code">{c.code}</span>
                <span className="home-promo__deal-copy">
                  <strong>{c.title}</strong>
                  <span>{c.description}</span>
                </span>
                <span className="home-promo__hint">{copied === c.code ? "Скопировано" : "Копировать"}</span>
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
