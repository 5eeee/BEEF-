"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import AdminCard, { StatCard } from "@/components/admin/AdminCard";
import { fetchAdminStats, type AdminStats } from "@/lib/admin-api";

function formatMoney(value: string) {
  const num = Number(value);
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(num) ? num : 0);
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка загрузки"));
  }, []);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Дашборд</h1>
          <p className="mt-1 text-sm text-muted">Сводка за сегодня</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Заказов сегодня"
            value={stats ? String(stats.orders_today) : "—"}
            hint={stats?.date}
          />
          <StatCard
            label="Выручка сегодня"
            value={stats ? formatMoney(stats.revenue_today) : "—"}
          />
          <StatCard
            label="Активных заказов"
            value={stats ? String(stats.active_orders) : "—"}
            hint="Оплаченные и в работе"
          />
        </div>

        <AdminCard title="Быстрые действия">
          <div className="flex flex-wrap gap-3">
            <a
              href="/admin/orders"
              className="rounded-xl bg-terracotta px-4 py-2 text-sm font-semibold text-white hover:bg-terracotta-dark"
            >
              Управление заказами
            </a>
            <a
              href="/admin/menu"
              className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-ink hover:border-terracotta/30"
            >
              Редактировать меню
            </a>
          </div>
        </AdminCard>
      </div>
    </AdminShell>
  );
}
