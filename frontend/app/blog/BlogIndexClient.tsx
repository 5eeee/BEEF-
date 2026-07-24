"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import Header from "@/components/Header";
import { useUiPrefs } from "@/components/UiPrefs";
import localPosts from "@/content/blog.json";
import { fetchBlogPosts } from "@/lib/api";
import type { BlogPost } from "@/lib/types";

export default function BlogIndexClient() {
  const { t, locale } = useUiPrefs();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchBlogPosts(24)
      .then((data) => {
        if (!alive) return;
        const items = data.items?.length ? data.items : (localPosts as BlogPost[]);
        setPosts(items);
      })
      .catch(() => {
        if (alive) setPosts(localPosts as BlogPost[]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="about-page blog-page">
      <Header theme="dark" transparent={false} variant="hero" onCartClick={() => setCartOpen(true)} />

      <main className="blog-page__main">
        <div className="container-page blog-page__head">
          <h1 className="blog-page__title">{t("blogTitle")}</h1>
          <p className="blog-page__lead">{t("blogLead")}</p>
        </div>

        <div className="container-page blog-page__grid-wrap">
          {loading ? <p className="blog-page__status">{t("loadingMenu")}</p> : null}

          <div className="blog-page__grid">
            {posts.map((post) => (
              <article key={post.id} className="blog-card">
                <Link href={`/blog/${post.slug}`} className="blog-card__media">
                  {post.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.cover_image_url} alt="" loading="lazy" />
                  ) : (
                    <span className="blog-card__ph" aria-hidden>
                      🍔
                    </span>
                  )}
                </Link>
                <div className="blog-card__body">
                  {post.published_at ? <time className="blog-card__date">{formatDate(post.published_at)}</time> : null}
                  <h2 className="blog-card__title">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  {post.excerpt ? <p className="blog-card__excerpt">{post.excerpt}</p> : null}
                  <Link href={`/blog/${post.slug}`} className="blog-card__more">
                    {t("readMore")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
