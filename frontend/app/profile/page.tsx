"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import PushSubscribeButton from "@/components/PushSubscribeButton";
import { useAuth } from "@/components/AuthProvider";
import { readSavedAddresses } from "@/lib/delivery-address";
import type { SavedAddress } from "@/lib/types";

export default function ProfilePage() {
  const { user, isLoggedIn, openLogin, logout } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    setAddresses(readSavedAddresses());
  }, []);

  return (
    <>
      <Header />
      <main className="beef-page container-page max-w-lg py-8">
        <h1 className="mb-6 text-3xl font-bold">Настройки</h1>

        <section className="mb-6 rounded-2xl border border-stone-100 bg-white p-5">
          <h2 className="mb-3 font-semibold">Профиль</h2>
          {isLoggedIn && user ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted">Телефон:</span> {user.phone}
              </p>
              {user.name && (
                <p>
                  <span className="text-muted">Имя:</span> {user.name}
                </p>
              )}
              <button
                type="button"
                onClick={logout}
                className="mt-3 text-sm text-red-600 hover:underline"
              >
                Выйти
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-sm text-muted">Войдите для доступа к истории заказов</p>
              <button
                type="button"
                onClick={openLogin}
                className="rounded-xl bg-terracotta px-6 py-2 text-sm font-semibold text-white"
              >
                Войти
              </button>
            </div>
          )}
        </section>

        <section className="mb-6 rounded-2xl border border-stone-100 bg-white p-5">
          <h2 className="mb-3 font-semibold">Адреса доставки</h2>
          <p className="mb-3 text-sm text-muted">
            Сохраняются при выборе в шапке (личный кабинет на устройстве).
          </p>
          {addresses.length ? (
            <ul className="space-y-3 text-sm">
              {addresses.map((a) => (
                <li key={a.id} className="border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                  {a.label ? <p className="font-semibold">{a.label}</p> : null}
                  <p className={a.label ? "text-muted" : "font-medium"}>{a.address}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Пока пусто — укажите адрес в шапке меню.</p>
          )}
        </section>

        <PushSubscribeButton />
      </main>
    </>
  );
}
