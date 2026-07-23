"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { checkout, fetchCart, fetchUserAddresses, suggestAddress } from "@/lib/api";
import type { SavedAddress } from "@/lib/types";

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, openLogin } = useAuth();
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [address, setAddress] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [promo, setPromo] = useState(searchParams.get("promo") || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [subtotal, setSubtotal] = useState("0");

  useEffect(() => {
    fetchCart()
      .then((c) => setSubtotal(c.subtotal))
      .catch(() => router.push("/cart"));
  }, [router]);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  useEffect(() => {
    if (!isLoggedIn) {
      setSavedAddresses([]);
      return;
    }
    fetchUserAddresses().then(setSavedAddresses).catch(() => setSavedAddresses([]));
  }, [isLoggedIn]);

  useEffect(() => {
    if (address.length < 2 || deliveryType !== "delivery") {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      suggestAddress(address).then(setSuggestions).catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(t);
  }, [address, deliveryType]);

  const selectSavedAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setAddress(addr.address);
    setSuggestions([]);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const order = await checkout({
        delivery_type: deliveryType,
        customer_name: name,
        customer_phone: phone,
        delivery_address: deliveryType === "delivery" ? address : null,
        comment: comment || null,
        promo_code: promo || null,
      });
      window.dispatchEvent(new Event("cart-updated"));
      router.push(`/payment/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка оформления");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <fieldset className="flex gap-3">
        <label className="flex-1 cursor-pointer rounded-xl border border-stone-200 px-4 py-3 has-[:checked]:border-terracotta has-[:checked]:bg-cream">
          <input
            type="radio"
            name="delivery"
            checked={deliveryType === "delivery"}
            onChange={() => setDeliveryType("delivery")}
            className="mr-2 accent-terracotta"
          />
          Доставка
        </label>
        <label className="flex-1 cursor-pointer rounded-xl border border-stone-200 px-4 py-3 has-[:checked]:border-terracotta has-[:checked]:bg-cream">
          <input
            type="radio"
            name="delivery"
            checked={deliveryType === "pickup"}
            onChange={() => setDeliveryType("pickup")}
            className="mr-2 accent-terracotta"
          />
          Самовывоз
        </label>
      </fieldset>

      <div>
        <label className="mb-1 block text-sm font-medium">Имя</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-stone-200 px-4 py-3"
          placeholder="Иван"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Телефон</label>
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          pattern="\+7\d{10}"
          className="w-full rounded-xl border border-stone-200 px-4 py-3"
          placeholder="+79001234567"
        />
        {!isLoggedIn && (
          <button
            type="button"
            onClick={openLogin}
            className="mt-2 text-sm text-terracotta hover:underline"
          >
            Войти для сохранения истории заказов
          </button>
        )}
      </div>

      {deliveryType === "delivery" && (
        <>
          {savedAddresses.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Сохранённые адреса</p>
              <div className="space-y-2">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => selectSavedAddress(addr)}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                      selectedAddressId === addr.id
                        ? "border-terracotta bg-cream"
                        : "border-stone-200 hover:bg-cream"
                    }`}
                  >
                    {addr.label && (
                      <span className="mb-0.5 block font-medium">{addr.label}</span>
                    )}
                    {addr.address}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="relative">
            <label className="mb-1 block text-sm font-medium">Адрес доставки</label>
            <input
              required
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setSelectedAddressId(null);
              }}
              className="w-full rounded-xl border border-stone-200 px-4 py-3"
              placeholder="Начните вводить адрес…"
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border bg-white shadow-lg">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm hover:bg-cream"
                      onClick={() => {
                        setAddress(s);
                        setSuggestions([]);
                      }}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Комментарий</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-stone-200 px-4 py-3"
          placeholder="Домофон, подъезд…"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Промокод</label>
        <input
          value={promo}
          onChange={(e) => setPromo(e.target.value.toUpperCase())}
          className="w-full rounded-xl border border-stone-200 px-4 py-3"
          placeholder="WELCOME10"
        />
      </div>

      <div className="rounded-2xl bg-cream p-4">
        <p className="text-sm text-muted">Сумма заказа</p>
        <p className="text-2xl font-bold text-terracotta">
          {Number(subtotal).toLocaleString("ru-RU")} ₽
        </p>
        {deliveryType === "delivery" && <p className="text-sm text-muted">+ доставка 199 ₽</p>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-terracotta py-4 text-lg font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Оформляем…" : "Перейти к оплате"}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="container-page max-w-2xl py-8">
        <h1 className="mb-6 text-3xl font-bold">Оформление заказа</h1>
        <Suspense fallback={<p className="text-muted">Загрузка…</p>}>
          <CheckoutForm />
        </Suspense>
      </main>
    </>
  );
}
