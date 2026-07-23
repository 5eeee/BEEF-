"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import AdminCard, { AdminTable, StatusBadge } from "@/components/admin/AdminCard";
import { fetchAdminProducts, updateAdminProduct } from "@/lib/admin-api";
import type { Product } from "@/lib/types";

function formatMoney(value: string) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default function AdminMenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await fetchAdminProducts();
      setProducts(data.items);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleAvailability(product: Product) {
    try {
      const updated = await updateAdminProduct(product.id, {
        is_available: !product.is_available,
      });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка обновления");
    }
  }

  function startEditPrice(product: Product) {
    setEditing(product.id);
    setEditPrice(product.price);
  }

  async function savePrice(productId: string) {
    try {
      const updated = await updateAdminProduct(productId, { price: editPrice });
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      setEditing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка обновления цены");
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Меню</h1>
          <p className="mt-1 text-sm text-muted">Управление позициями, ценами и доступностью</p>
        </div>

        <AdminCard title="Позиции меню">
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          {loading ? (
            <p className="text-sm text-muted">Загрузка…</p>
          ) : (
            <AdminTable>
              <thead className="bg-cream text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Название</th>
                  <th className="px-4 py-3">Категория</th>
                  <th className="px-4 py-3">Цена</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-cream/50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-muted">{product.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">{product.category_slug}</td>
                    <td className="px-4 py-3">
                      {editing === product.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-24 rounded-lg border border-stone-200 px-2 py-1 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => savePrice(product.id)}
                            className="text-sm font-medium text-terracotta hover:underline"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditPrice(product)}
                          className="font-medium hover:text-terracotta"
                        >
                          {formatMoney(product.price)}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={product.is_available ? "approved" : "rejected"} />
                      {!product.is_available && (
                        <span className="ml-2 text-xs text-muted">скрыто</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleAvailability(product)}
                        className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm hover:border-terracotta/30 hover:text-terracotta"
                      >
                        {product.is_available ? "Скрыть" : "Показать"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          )}
        </AdminCard>
      </div>
    </AdminShell>
  );
}
