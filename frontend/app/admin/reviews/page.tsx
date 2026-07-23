"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import AdminCard, { AdminTable, StatusBadge } from "@/components/admin/AdminCard";
import { fetchAdminReviews, updateReviewStatus, type Review } from "@/lib/admin-api";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("");

  async function load(status?: string) {
    setLoading(true);
    try {
      const data = await fetchAdminReviews(status || undefined);
      setReviews(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(filter);
  }, [filter]);

  async function moderate(reviewId: string, status: string) {
    try {
      const updated = await updateReviewStatus(reviewId, status);
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? updated : r)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка модерации");
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">Отзывы</h1>
            <p className="mt-1 text-sm text-muted">Модерация отзывов клиентов (stub)</p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
          >
            <option value="">Все</option>
            <option value="pending">На модерации</option>
            <option value="approved">Одобренные</option>
            <option value="rejected">Отклонённые</option>
          </select>
        </div>

        <AdminCard title="Список отзывов">
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          {loading ? (
            <p className="text-sm text-muted">Загрузка…</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted">Отзывов нет</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-xl border border-stone-100 bg-cream/30 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{review.author}</span>
                        <span className="text-mustard">{"★".repeat(review.rating)}</span>
                      </div>
                      <p className="mt-2 text-sm text-ink">{review.text}</p>
                      <p className="mt-2 text-xs text-muted">
                        {new Date(review.created_at).toLocaleString("ru-RU")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={review.status} />
                      {review.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => moderate(review.id, "approved")}
                            className="rounded-lg bg-terracotta px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Одобрить
                          </button>
                          <button
                            type="button"
                            onClick={() => moderate(review.id, "rejected")}
                            className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs hover:border-red-300 hover:text-red-600"
                          >
                            Отклонить
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </AdminCard>
      </div>
    </AdminShell>
  );
}
