"use client";

import Link from "next/link";
import type { BlogPost } from "@/lib/types";

export default function BlogPreview({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Из блога</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <article
            key={post.id}
            className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition hover:shadow-md"
          >
            {post.cover_image_url && (
              <div
                className="h-40 bg-cover bg-center"
                style={{ backgroundImage: `url(${post.cover_image_url})` }}
                role="img"
                aria-label={post.title}
              />
            )}
            <div className="space-y-2 p-5">
              <h3 className="text-lg font-semibold text-ink">{post.title}</h3>
              {post.excerpt && <p className="text-sm text-muted line-clamp-2">{post.excerpt}</p>}
              <Link
                href={`/blog/${post.slug}`}
                className="inline-block text-sm font-medium text-terracotta hover:underline"
              >
                Читать далее →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
