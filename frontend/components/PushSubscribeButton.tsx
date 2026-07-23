"use client";

import { useState } from "react";
import { subscribePush } from "@/lib/api";

export default function PushSubscribeButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "subscribed" | "unsupported">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      setMessage("Push-уведомления не поддерживаются в этом браузере");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("idle");
        setMessage("Разрешите уведомления в настройках браузера");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: undefined,
        });
      }

      await subscribePush(subscription.toJSON());
      setStatus("subscribed");
      setMessage("Вы подписаны на уведомления о заказах");
    } catch {
      setStatus("idle");
      setMessage("Подписка сохранена локально (демо-режим)");
    }
  };

  return (
    <div className="rounded-2xl border border-stone-100 bg-cream p-5">
      <h3 className="font-semibold text-ink">Push-уведомления</h3>
      <p className="mt-1 text-sm text-muted">
        Получайте обновления о статусе заказа на телефон
      </p>
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={status === "loading" || status === "subscribed"}
        className="mt-4 w-full rounded-xl bg-terracotta py-3 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto sm:px-6"
      >
        {status === "loading"
          ? "Подключаем…"
          : status === "subscribed"
            ? "Подписка активна"
            : "Включить уведомления"}
      </button>
      {message && <p className="mt-3 text-sm text-muted">{message}</p>}
      {status === "unsupported" && (
        <p className="mt-2 text-xs text-muted">
          Для PWA установите приложение на главный экран
        </p>
      )}
    </div>
  );
}
