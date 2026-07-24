"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CartDrawer from "@/components/CartDrawer";
import Header from "@/components/Header";
import { useUiPrefs } from "@/components/UiPrefs";
import localPosts from "@/content/blog.json";
import { fetchBlogPost } from "@/lib/api";
import type { BlogPost } from "@/lib/types";

export default function BlogPostPage() {
  const params = useParams();
  const slug = String(params.slug || "");
  const { t, locale } = useUiPrefs();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    fetchBlogPost(slug)
      .then((data) => {
        if (alive) setPost(data);
      })
      .catch(() => {
        const local = (localPosts as BlogPost[]).find((p) => p.slug === slug) || null;
        if (alive) {
          if (local) setPost(local);
          else setError(t("articleNotFound"));
        }
      });
    return () => {
      alive = false;
    };
  }, [slug, t]);

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

      <main className="blog-article">
        <div className="container-page blog-article__inner">
          <Link href="/blog" className="blog-article__back">
            ← {t("blog")}
          </Link>

          {error ? <p className="blog-page__status">{error}</p> : null}

          {post ? (
            <article>
              {post.published_at ? <time className="blog-card__date">{formatDate(post.published_at)}</time> : null}
              <h1 className="blog-article__title">{post.title}</h1>
              {post.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.cover_image_url} alt="" className="blog-article__cover" />
              ) : null}
              <div className="blog-article__content">{post.content}</div>
            </article>
          ) : !error ? (
            <p className="blog-page__status">{t("loadingMenu")}</p>
          ) : null}
        </div>
      </main>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
