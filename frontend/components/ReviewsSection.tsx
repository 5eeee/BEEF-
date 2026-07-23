"use client";

import type { Review } from "@/lib/types";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-mustard" aria-label={`Оценка ${rating} из 5`}>
      {"★".repeat(rating)}
      <span className="text-stone-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function ReviewsSection({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Отзывы гостей</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="font-semibold text-ink">{review.author_name}</p>
              <Stars rating={review.rating} />
            </div>
            <p className="text-sm leading-relaxed text-muted">{review.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
