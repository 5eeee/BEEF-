"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import AdminCard, { AdminTable, StatusBadge } from "@/components/admin/AdminCard";
import { fetchAdminPromos, updateAdminPromo, type PromoCode } from "@/lib/admin-api";

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await fetchAdminPromos();
      setPromos(data);
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

  async function toggleActive(promo: PromoCode) {
    try {
      const updated = await updateAdminPromo(promo.code, { active: !promo.active });
      setPromos((prev) => prev.map((p) => (p.code === promo.code ? updated : p)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка обновления");
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Промокоды</h1>
          <p className="mt-1 text-sm text-muted">Управление акциями и промокодами</p>
        </div>

        <AdminCard title="Активные промокоды">
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          {loading ? (
            <p className="text-sm text-muted">Загрузка…</p>
          ) : promos.length === 0 ? (
            <p className="text-sm text-muted">Промокодов нет</p>
          ) : (
            <AdminTable>
              <thead className="bg-cream text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Код</th>
                  <th className="px-4 py-3">Тип</th>
                  <th className="px-4 py-3">Значение</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {promos.map((promo) => (
                  <tr key={promo.code} className="hover:bg-cream/50">
                    <td className="px-4 py-3 font-mono font-semibold text-terracotta">{promo.code}</td>
                    <td className="px-4 py-3">{promo.type === "percent" ? "Процент" : "Фикс."}</td>
                    <td className="px-4 py-3">
                      {promo.type === "percent" ? `${promo.value}%` : `${promo.value} ₽`}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={promo.active ? "approved" : "rejected"} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleActive(promo)}
                        className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm hover:border-terracotta/30 hover:text-terracotta"
                      >
                        {promo.active ? "Отключить" : "Включить"}
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
