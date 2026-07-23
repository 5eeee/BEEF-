"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import AdminCard, { AdminTable, StatusBadge } from "@/components/admin/AdminCard";
import { fetchAdminOrders, updateAdminOrderStatus } from "@/lib/admin-api";
import type { Order } from "@/lib/types";

const KITCHEN_STATUSES = ["paid", "confirmed", "preparing", "ready", "delivering", "completed"];

const STATUS_LABELS: Record<string, string> = {
  paid: "Оплачен",
  confirmed: "Подтверждён",
  preparing: "Готовится",
  ready: "Готов",
  delivering: "В пути",
  completed: "Завершён",
  pending_payment: "Ожидает оплаты",
  cancelled: "Отменён",
};

function formatMoney(value: string) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchAdminOrders();
      setOrders(data);
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

  async function handleStatusChange(orderId: string, status: string) {
    setUpdating(orderId);
    try {
      const updated = await updateAdminOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Не удалось обновить статус");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Заказы</h1>
          <p className="mt-1 text-sm text-muted">Список заказов и смена статуса</p>
        </div>

        <AdminCard title="Все заказы">
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          {loading ? (
            <p className="text-sm text-muted">Загрузка…</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted">Заказов пока нет</p>
          ) : (
            <AdminTable>
              <thead className="bg-cream text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Номер</th>
                  <th className="px-4 py-3">Клиент</th>
                  <th className="px-4 py-3">Сумма</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Дата</th>
                  <th className="px-4 py-3">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream/50">
                    <td className="px-4 py-3 font-medium text-terracotta">{order.order_number}</td>
                    <td className="px-4 py-3">
                      <div>{order.customer_name}</div>
                      <div className="text-xs text-muted">{order.customer_phone}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatMoney(order.total)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        disabled={updating === order.id}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm focus:border-terracotta focus:outline-none"
                      >
                        {Array.from(new Set([order.status, ...KITCHEN_STATUSES])).map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status] || status}
                          </option>
                        ))}
                      </select>
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
