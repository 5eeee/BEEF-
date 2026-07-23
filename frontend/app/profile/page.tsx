"use client";

import Header from "@/components/Header";
import PushSubscribeButton from "@/components/PushSubscribeButton";
import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
  const { user, isLoggedIn, openLogin, logout } = useAuth();

  return (
    <>
      <Header />
      <main className="container-page max-w-lg py-8">
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

        <PushSubscribeButton />
      </main>
    </>
  );
}
