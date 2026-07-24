"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUiPrefs } from "@/components/UiPrefs";
import { fetchCart, removeCartItem, updateCartItem } from "@/lib/api";
import type { Cart } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
};

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function CartDrawer({ open, onClose }: Props) {
  const { t, locale } = useUiPrefs();
  const [cart, setCart] = useState<Cart | null>(null);

  const load = () => {
    fetchCart()
      .then(setCart)
      .catch(() => setCart(null));
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const money = (n: number | string) =>
    Number(n).toLocaleString(locale === "en" ? "en-US" : "ru-RU");

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

  if (!open) return null;

  return (
    <div className="cart-drawer-overlay">
      <button type="button" className="cart-drawer-overlay__backdrop" aria-label={t("close")} onClick={onClose} />
      <aside className="cart-drawer" aria-label={t("cart")}>
        <div className="cart-drawer__head">
          <h2 className="cart-drawer__title">{t("cart")}</h2>
          <button type="button" className="beef-modal__close" onClick={onClose} aria-label={t("close")}>
            <CloseIcon />
          </button>
        </div>

        <div className="cart-drawer__body">
          {!cart?.items.length ? (
            <div className="cart-drawer__empty">
              <p>{t("cartEmpty")}</p>
              <Link href="/#menu" className="beef-modal__primary" onClick={onClose}>
                {t("goToMenu")}
              </Link>
            </div>
          ) : (
            <ul className="cart-drawer__list">
              {cart.items.map((item) => (
                <li key={item.product_id} className="cart-drawer__item">
                  <div className="cart-drawer__thumb">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    ) : null}
                  </div>
                  <div className="cart-drawer__meta">
                    <p className="cart-drawer__name">{item.name}</p>
                    <p className="cart-drawer__price">{money(item.unit_price)} ₽</p>
                    <div className="cart-drawer__qty">
                      <button type="button" onClick={() => updateQty(item.product_id, item.quantity - 1)} aria-label="−">
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateQty(item.product_id, item.quantity + 1)} aria-label="+">
                        +
                      </button>
                      <button type="button" className="cart-drawer__remove" onClick={() => remove(item.product_id)}>
                        {t("remove")}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart && cart.items.length > 0 ? (
          <div className="cart-drawer__foot">
            <div className="cart-drawer__total">
              <span>{t("total")}</span>
              <strong>{money(cart.subtotal)} ₽</strong>
            </div>
            <Link href="/cart" onClick={onClose} className="beef-modal__secondary">
              {t("openCart")}
            </Link>
            <Link href="/checkout" onClick={onClose} className="beef-modal__primary">
              {t("checkout")}
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
