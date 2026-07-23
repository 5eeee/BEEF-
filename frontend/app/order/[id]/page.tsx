"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import OrderStatusTimeline from "@/components/OrderStatusTimeline";
import { fetchOrder } from "@/lib/api";
import type { Order } from "@/lib/types";

const POLL_INTERVAL_MS = 30_000;

export default function OrderPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    const load = () => {
      fetchOrder(params.id)
        .then((o) => {
          if (active) {
            setOrder(o);
            setError(false);
          }
        })
        .catch(() => {
          if (active) setError(true);
        });
    };

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [params.id]);

  if (error && !order) {
    return (
      <>
        <Header />
        <main className="container-page py-16 text-center">
          <p className="text-muted">Заказ не найден</p>
          <Link href="/" className="mt-4 inline-block text-terracotta hover:underline">
            В меню
          </Link>
        </main>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header />
        <main className="container-page py-16 text-center text-muted">Загрузка заказа…</main>
      </>
    );
  }

  const isPaid = !["pending", "cancelled"].includes(order.status.toLowerCase());

  return (
    <>
      <Header />
      <main className="container-page max-w-lg py-8">
        <div className="mb-6 text-center">
          {isPaid ? (
            <>
              <div className="mb-4 text-5xl">✓</div>
              <h1 className="text-3xl font-bold">Заказ принят!</h1>
            </>
          ) : (
            <>
              <div className="mb-4 text-5xl">⏳</div>
              <h1 className="text-3xl font-bold">Ожидает оплаты</h1>
            </>
          )}
          <p className="mt-2 text-lg text-muted">Номер заказа</p>
          <p className="text-2xl font-bold text-terracotta">{order.order_number}</p>
        </div>

        {!isPaid && (
          <Link
            href={`/payment/${order.id}`}
            className="mb-8 block w-full rounded-2xl bg-terracotta py-3 text-center font-semibold text-white"
          >
            Оплатить заказ
          </Link>
        )}

        <section className="mb-8 rounded-2xl border border-stone-100 bg-white p-6">
          <h2 className="mb-4 font-semibold">Статус заказа</h2>
          <OrderStatusTimeline status={order.status} deliveryType={order.delivery_type} />
          <p className="mt-4 text-xs text-muted">Обновляется автоматически каждые 30 сек</p>
        </section>

        <div className="space-y-2 rounded-2xl bg-cream p-6 text-sm">
          <p>
            <span className="text-muted">Сумма:</span>{" "}
            {Number(order.total).toLocaleString("ru-RU")} ₽
          </p>
          <p>
            <span className="text-muted">Телефон:</span> {order.customer_phone}
          </p>
          {order.delivery_address && (
            <p>
              <span className="text-muted">Адрес:</span> {order.delivery_address}
            </p>
          )}
          {order.estimated_ready_at && (
            <p>
              <span className="text-muted">Готовность:</span>{" "}
              {new Date(order.estimated_ready_at).toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
          {order.items.length > 0 && (
            <div className="mt-4 border-t border-stone-200 pt-4">
              <p className="mb-2 font-medium">Состав заказа</p>
              <ul className="space-y-1">
                {order.items.map((item) => (
                  <li key={item.product_id} className="flex justify-between">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>{Number(item.line_total).toLocaleString("ru-RU")} ₽</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Link
          href="/"
          className="mt-8 block w-full rounded-2xl border border-stone-200 py-3 text-center font-semibold text-ink hover:bg-cream"
        >
          Вернуться в меню
        </Link>
      </main>
    </>
  );
}
