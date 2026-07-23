"use client";

import Link from "next/link";
import { useState } from "react";
import type { BlogPost, Campaign, Category } from "@/lib/types";

export const FALLBACK_PROMOS: Campaign[] = [
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

const FALLBACK_NEWS: BlogPost[] = [
  {
    id: "fallback-1",
    slug: "",
    title: "Готовим после заказа",
    excerpt: "Котлета на гриле и сборка в момент заказа — так бургер доезжает горячим.",
    published_at: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    slug: "",
    title: "Зоны доставки по Коломне",
    excerpt: "Центр, Старый город, Колычево и Щурово — уточняйте район перед заказом.",
    published_at: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    slug: "",
    title: "Самовывоз в ТРЦ Рио",
    excerpt: "Фудкорт, третий этаж. Заберите заказ сами — без очереди на курьера.",
    published_at: new Date().toISOString(),
  },
];

type Props = {
  campaigns: Campaign[];
  posts: BlogPost[];
  categories: Category[];
  onCategoryPick?: (slug: string | null) => void;
};

export default function MenuSpotlight({ campaigns, posts, categories, onCategoryPick }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const promos = campaigns.length ? campaigns : FALLBACK_PROMOS;
  const news = posts.length ? posts.slice(0, 3) : FALLBACK_NEWS;

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
    <section className="menu-spotlight" aria-labelledby="menu-spotlight-title">
      <div className="menu-spotlight__intro">
        <p className="menu-spotlight__eyebrow">Сейчас у нас</p>
        <h2 id="menu-spotlight-title" className="menu-spotlight__title">
          Новости и промокоды
        </h2>
        <p className="menu-spotlight__text">
          Сначала — что актуально. Ниже полное меню: бургеры, закуски, напитки и комбо.
        </p>
      </div>

      <div className="menu-spotlight__promos" aria-label="Промокоды">
        {promos.map((c) => (
          <button
            key={c.code}
            type="button"
            className="menu-spotlight__promo"
            onClick={() => copyCode(c.code)}
          >
            <span className="menu-spotlight__promo-code">{c.code}</span>
            <span className="menu-spotlight__promo-body">
              <strong>{c.title}</strong>
              <span>{c.description}</span>
            </span>
            <span className="menu-spotlight__promo-hint">
              {copied === c.code ? "Скопировано" : "Копировать"}
            </span>
          </button>
        ))}
      </div>

      <div className="menu-spotlight__news" aria-label="Новости">
        {news.map((post) => {
          const inner = (
            <>
              <strong>{post.title}</strong>
              {post.excerpt ? <span>{post.excerpt}</span> : null}
            </>
          );
          return post.slug ? (
            <Link key={post.id} href={`/blog/${post.slug}`} className="menu-spotlight__news-item">
              {inner}
            </Link>
          ) : (
            <div key={post.id} className="menu-spotlight__news-item">
              {inner}
            </div>
          );
        })}
        <Link href="/blog" className="menu-spotlight__news-more">
          Весь блог →
        </Link>
      </div>

      {categories.length ? (
        <div className="menu-spotlight__cats" aria-label="Категории меню">
          <button
            type="button"
            className="menu-spotlight__cat"
            onClick={() => {
              onCategoryPick?.(null);
              document.getElementById("menu-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            Всё меню
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className="menu-spotlight__cat"
              onClick={() => {
                onCategoryPick?.(cat.slug);
                document.getElementById("menu-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
