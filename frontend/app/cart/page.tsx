"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useUiPrefs } from "@/components/UiPrefs";
import { applyPromo, fetchCart, removeCartItem, updateCartItem } from "@/lib/api";
import type { Cart } from "@/lib/types";

export default function CartPage() {
  const { t, locale } = useUiPrefs();
  const [cart, setCart] = useState<Cart | null>(null);
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState("0");
  const [promoError, setPromoError] = useState("");
  const [loading, setLoading] = useState(true);

  const money = (n: number | string) =>
    Number(n).toLocaleString(locale === "en" ? "en-US" : "ru-RU");

  const load = () => {
    fetchCart()
      .then(setCart)
      .catch(() => setCart(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const updateQty = async (productId: string, quantity: number) => {
    const updated = await updateCartItem(productId, quantity);
    setCart(updated);
    window.dispatchEvent(new Event("cart-updated"));
  };

  const remove = async (productId: string) => {
    const updated = await removeCartItem(productId);
    setCart(updated);
    window.dispatchEvent(new Event("cart-updated"));
  };

  const apply = async () => {
    setPromoError("");
    try {
      const res = await applyPromo(promo);
      setDiscount(res.discount);
    } catch (e) {
      setPromoError(e instanceof Error ? e.message : "Промокод не найден");
      setDiscount("0");
    }
  };

  const total = cart ? Number(cart.subtotal) - Number(discount) : 0;

  return (
    <div className="about-page">
      <Header theme="dark" transparent={false} variant="hero" />
      <main className="beef-page container-page py-8">
        <h1 className="mb-6 text-3xl font-bold">{t("cart")}</h1>
        {loading ? (
          <p className="text-muted">{t("loadingMenu")}</p>
        ) : !cart?.items.length ? (
          <div className="py-16 text-center">
            <p className="mb-4 text-muted">{t("cartEmpty")}</p>
            <Link href="/#menu" className="font-semibold text-[#c8e635] hover:underline">
              {t("goToMenu")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <ul className="space-y-4 lg:col-span-2">
              {cart.items.map((item) => (
                <li
                  key={item.product_id}
                  className="flex gap-4 rounded-2xl bg-cream/50 p-4 ring-1 ring-stone-100"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
                    {item.image_url && (
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-[#c8e635] font-bold">{money(item.unit_price)} ₽</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQty(item.product_id, item.quantity - 1)}
                        className="h-8 w-8 rounded-full bg-white font-bold"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.product_id, item.quantity + 1)}
                        className="h-8 w-8 rounded-full bg-white font-bold"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item.product_id)}
                        className="ml-auto text-sm text-muted hover:text-red-600"
                      >
                        {t("remove")}
                      </button>
                    </div>
                  </div>
                  <p className="font-bold">{money(item.line_total)} ₽</p>
                </li>
              ))}
            </ul>
            <aside className="h-fit space-y-4 rounded-2xl bg-cream p-6">
              <h2 className="text-lg font-bold">Промокод</h2>
              <div className="flex gap-2">
                <input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value.toUpperCase())}
                  placeholder="BEEF300"
                  className="flex-1 rounded-xl border border-stone-200 px-3 py-2"
                />
                <button
                  type="button"
                  onClick={apply}
                  className="rounded-xl bg-[#c8e635] px-4 py-2 font-semibold text-ink"
                >
                  OK
                </button>
              </div>
              {promoError && <p className="text-sm text-red-600">{promoError}</p>}
              <div className="space-y-2 border-t border-stone-200 pt-4 text-sm">
                <div className="flex justify-between">
                  <span>Сумма</span>
                  <span>{money(cart.subtotal)} ₽</span>
                </div>
                {Number(discount) > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Скидка</span>
                    <span>−{money(discount)} ₽</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>{t("total")}</span>
                  <span>{money(total)} ₽</span>
                </div>
              </div>
              <Link
                href={`/checkout${promo ? `?promo=${promo}` : ""}`}
                className="block w-full rounded-2xl bg-[#c8e635] py-4 text-center font-semibold text-[#14110f]"
              >
                {t("checkout")}
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
