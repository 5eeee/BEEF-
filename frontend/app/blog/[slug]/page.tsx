"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import { fetchBlogPost } from "@/lib/api";
import type { BlogPost } from "@/lib/types";

export default function BlogPostPage() {
  const params = useParams();
  const slug = String(params.slug || "");
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    fetchBlogPost(slug)
      .then(setPost)
      .catch(() => setError("Статья не найдена"));
  }, [slug]);

  return (
    <>
      <Header />
      <main className="beef-page container-page max-w-3xl py-8">
        <Link href="/" className="mb-6 inline-block text-sm text-terracotta hover:underline">
          ← На главную
        </Link>
        {error && <p className="text-muted">{error}</p>}
        {post && (
          <article className="space-y-4">
            <h1 className="text-3xl font-bold">{post.title}</h1>
            {post.cover_image_url && (
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full rounded-2xl object-cover"
              />
            )}
            <div className="prose prose-stone max-w-none whitespace-pre-line text-ink">
              {post.content}
            </div>
          </article>
        )}
      </main>
    </>
  );
}
