"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import Header from "@/components/Header";
import { fetchBlogPosts } from "@/lib/api";
import type { BlogPost } from "@/lib/types";

export default function BlogIndexClient() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [error, setError] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    fetchBlogPosts(24)
      .then((data) => setPosts(data.items || []))
      .catch(() => setError("Пока нет опубликованных статей"));
  }, []);

  return (
    <div className="about-page">
      <Header theme="dark" transparent={false} variant="hero" onCartClick={() => setCartOpen(true)} />

      <main className="beef-page container-page py-10">
        <p className="about-hero__eyebrow">Блог</p>
        <h1 className="about-hero__brand" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}>
          Новости и вкус
        </h1>
        <p className="about-hero__lead" style={{ maxWidth: "36rem" }}>
          Рецепты, новости корнера и всё, что происходит вокруг #BEEFштекс.
        </p>

        {error && !posts.length ? <p className="mt-8 text-white/50">{error}</p> : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {post.cover_image_url ? (
                <div
                  className="h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url(${post.cover_image_url})` }}
                  role="img"
                  aria-label={post.title}
                />
              ) : (
                <div className="flex h-40 items-center justify-center bg-white/5 text-3xl" aria-hidden>
                  🍔
                </div>
              )}
              <div className="space-y-2 p-5">
                <h2 className="text-lg font-semibold text-white">{post.title}</h2>
                {post.excerpt ? <p className="text-sm text-white/55 line-clamp-2">{post.excerpt}</p> : null}
                <Link href={`/blog/${post.slug}`} className="inline-block text-sm font-medium text-[#c8e635] hover:underline">
                  Читать →
                </Link>
              </div>
            </article>
          ))}
        </div>

        {!posts.length && !error ? <p className="mt-8 text-white/40">Загружаем…</p> : null}
      </main>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
