"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { fetchUserOrders } from "@/lib/api";
import type { Order } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  preparing: "Готовится",
  ready: "Готов",
  delivering: "В пути",
  completed: "Доставлен",
  cancelled: "Отменён",
};

export default function OrdersPage() {
  const { user, isLoggedIn, openLogin, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn || !user) {
      setLoading(false);
      return;
    }
    fetchUserOrders(user.id)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [authLoading, isLoggedIn, user]);

  return (
    <>
      <Header />
      <main className="container-page max-w-2xl py-8">
        <h1 className="mb-6 text-3xl font-bold">Мои заказы</h1>

        {!authLoading && !isLoggedIn && (
          <div className="rounded-2xl bg-cream p-8 text-center">
            <p className="mb-4 text-muted">Войдите, чтобы видеть историю заказов</p>
            <button
              type="button"
              onClick={openLogin}
              className="rounded-2xl bg-terracotta px-8 py-3 font-semibold text-white"
            >
              Войти
            </button>
          </div>
        )}

        {isLoggedIn && loading && <p className="text-muted">Загрузка…</p>}

        {isLoggedIn && !loading && orders.length === 0 && (
          <div className="rounded-2xl bg-cream p-8 text-center">
            <p className="mb-4 text-muted">У вас пока нет заказов</p>
            <Link
              href="/"
              className="inline-block rounded-2xl bg-terracotta px-8 py-3 font-semibold text-white"
            >
              Перейти в меню
            </Link>
          </div>
        )}

        {isLoggedIn && orders.length > 0 && (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/order/${order.id}`}
                  className="block rounded-2xl border border-stone-100 bg-white p-5 transition hover:border-terracotta/30 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-terracotta">{order.order_number}</p>
                      <p className="mt-1 text-sm text-muted">
                        {new Date(order.created_at).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {Number(order.total).toLocaleString("ru-RU")} ₽
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {STATUS_LABELS[order.status.toLowerCase()] || order.status}
                      </p>
                    </div>
                  </div>
                  {order.delivery_address && (
                    <p className="mt-2 truncate text-sm text-muted">{order.delivery_address}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
