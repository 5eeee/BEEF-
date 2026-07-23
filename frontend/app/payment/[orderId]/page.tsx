"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { confirmPaymentMock, fetchOrder, initPayment } from "@/lib/api";
import type { Order } from "@/lib/types";

const PAYMENT_METHODS = [
  { id: "card", label: "Банковская карта", icon: "💳" },
  { id: "apple_pay", label: "Apple Pay", icon: "" },
  { id: "google_pay", label: "Google Pay", icon: "G" },
  { id: "sber_pay", label: "SberPay", icon: "С" },
];

export default function PaymentPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrder(params.orderId)
      .then((o) => {
        setOrder(o);
        if (o.status === "paid" || o.status === "completed") {
          router.replace(`/order/${params.orderId}`);
        }
      })
      .catch(() => setOrder(null));
  }, [params.orderId, router]);

  const handlePay = async () => {
    setError("");
    setLoading(true);
    try {
      const init = await initPayment(params.orderId, payment);
      await new Promise((r) => setTimeout(r, 1200));
      await confirmPaymentMock(init.payment_id, params.orderId);
      router.push(`/order/${params.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка оплаты");
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return (
      <>
        <Header />
        <main className="beef-page container-page py-16 text-center text-muted">Загрузка…</main>
      </>
    );
  }

  if (order.status === "paid" || order.status === "completed") {
    return (
      <>
        <Header />
        <main className="beef-page container-page py-16 text-center text-muted">Перенаправление…</main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="beef-page container-page max-w-lg py-8">
        <h1 className="mb-2 text-3xl font-bold">Оплата заказа</h1>
        <p className="mb-6 text-muted">
          Заказ <span className="font-semibold text-terracotta">{order.order_number}</span>
        </p>

        <div className="mb-6 rounded-2xl bg-cream p-5">
          <p className="text-sm text-muted">К оплате</p>
          <p className="text-3xl font-bold text-terracotta">
            {Number(order.total || order.subtotal).toLocaleString("ru-RU")} ₽
          </p>
          {order.delivery_address && (
            <p className="mt-2 text-sm text-muted">{order.delivery_address}</p>
          )}
        </div>

        <fieldset className="mb-6 space-y-2">
          <legend className="mb-3 text-sm font-medium">Способ оплаты</legend>
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                payment === m.id ? "border-terracotta bg-cream" : "border-stone-200"
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={payment === m.id}
                onChange={() => setPayment(m.id)}
                className="accent-terracotta"
              />
              {m.icon && <span className="text-lg">{m.icon}</span>}
              <span className="font-medium">{m.label}</span>
            </label>
          ))}
        </fieldset>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handlePay}
          disabled={loading}
          className="w-full rounded-2xl bg-terracotta py-4 text-lg font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Обрабатываем…" : `Оплатить ${Number(order.total || order.subtotal).toLocaleString("ru-RU")} ₽`}
        </button>

        <Link
          href={`/order/${params.orderId}`}
          className="mt-4 block text-center text-sm text-muted hover:text-terracotta"
        >
          Оплатить позже
        </Link>
      </main>
    </>
  );
}
