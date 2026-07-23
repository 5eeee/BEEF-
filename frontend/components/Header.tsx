"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { useUiPrefs } from "@/components/UiPrefs";
import { fetchCart } from "@/lib/api";
import type { Product } from "@/lib/types";

type Props = {
  onCartClick?: () => void;
  transparent?: boolean;
  theme?: "light" | "dark";
  /** auto: hero header until menu sheet, then search/address mode */
  variant?: "auto" | "hero" | "menu";
  onSearchSelect?: (product: Product) => void;
};

const ADDR_KEY = "beefshteks_delivery_address";
const DEFAULT_ADDR = "Коломна · доставка / самовывоз";

function IconUser() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.6" fill="currentColor" opacity="0.95" />
      <path
        d="M4.8 19.4c1.1-3.2 3.7-4.9 7.2-4.9s6.1 1.7 7.2 4.9"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3.5 5.5h1.7l1.35 10.2a2 2 0 0 0 2 1.75h8.2a2 2 0 0 0 2-1.7L20.2 8H7.1"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.2 11.2h8.2M9.5 14.2h7.4" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
      <circle cx="10.2" cy="20" r="1.35" fill="currentColor" />
      <circle cx="16.8" cy="20" r="1.35" fill="currentColor" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.1" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function IconMenu({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <>
          <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.8v2.2M12 19v2.2M2.8 12h2.2M19 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18.5 13.2A7.2 7.2 0 0 1 10.8 5.5 7.4 7.4 0 1 0 18.5 13.2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Header({
  onCartClick,
  transparent = false,
  theme = "light",
  variant = "auto",
  onSearchSelect,
}: Props) {
  const pathname = usePathname();
  const { t, colorMode, toggleLocale, toggleColorMode } = useUiPrefs();
  const [count, setCount] = useState(0);
  const { user, isLoggedIn, openLogin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [address, setAddress] = useState(DEFAULT_ADDR);
  const [addrOpen, setAddrOpen] = useState(false);
  const [addrDraft, setAddrDraft] = useState("");
  const isSheetPage = pathname === "/" || pathname === "/menu";

  const navItems = useMemo(
    () =>
      [
        { href: "/", label: t("home") },
        { href: "/menu", label: t("menu") },
        { href: "/about", label: t("about") },
        { href: "/contacts", label: t("contacts") },
        { href: "/blog", label: t("blog") },
      ] as const,
    [t]
  );

  useEffect(() => {
    fetchCart()
      .then((c) => setCount(c.item_count))
      .catch(() => setCount(0));
    const handler = () => {
      fetchCart()
        .then((c) => setCount(c.item_count))
        .catch(() => {});
    };
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ADDR_KEY);
      if (saved) setAddress(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (variant === "hero") {
      setProgress(0);
      return;
    }
    if (variant === "menu" || !transparent) {
      setProgress(1);
      return;
    }
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const vh = window.innerHeight;
        const y = window.scrollY;
        const p = Math.min(1, Math.max(0, (y - vh * 0.55) / (vh * 0.35)));
        setProgress(p);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [transparent, variant]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [navOpen]);

  const prefDark = colorMode === "dark";
  const isDark = theme === "dark" ? prefDark : theme === "light" ? false : prefDark;
  // Home uses theme="dark" prop but colorMode can force light header/menu chrome
  const useLightChrome = colorMode === "light";
  const inMenu = variant === "menu" || (variant === "auto" && progress > 0.5);

  const bg = transparent
    ? inMenu
      ? useLightChrome
        ? "rgba(247, 243, 238, 0.96)"
        : "rgba(51, 51, 51, 0.96)"
      : useLightChrome
        ? progress < 0.02
          ? "transparent"
          : `rgba(247, 243, 238, ${0.55 + progress * 0.42})`
        : isDark
          ? progress < 0.02
            ? "transparent"
            : `rgba(0, 0, 0, ${Math.min(0.7, progress * 0.9 + 0.15)})`
          : `rgba(247, 243, 238, ${0.55 + progress * 0.42})`
    : useLightChrome
      ? "rgba(255, 255, 255, 0.96)"
      : isDark
        ? "rgba(12, 12, 12, 0.94)"
        : "rgba(255, 255, 255, 0.96)";

  const border = transparent
    ? inMenu || progress > 0.05
      ? useLightChrome
        ? "rgba(0, 0, 0, 0.08)"
        : "rgba(255, 255, 255, 0.08)"
      : "transparent"
    : useLightChrome
      ? "rgba(0, 0, 0, 0.06)"
      : isDark
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(0, 0, 0, 0.06)";
  const blur = transparent ? (inMenu ? 14 : 8 + progress * 10) : 12;

  const saveAddress = () => {
    const next = addrDraft.trim() || DEFAULT_ADDR;
    setAddress(next);
    try {
      localStorage.setItem(ADDR_KEY, next);
    } catch {
      /* ignore */
    }
    setAddrOpen(false);
  };

  const navActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      className={`header-shell ${transparent ? "fixed inset-x-0 top-0 z-50" : "sticky top-0 z-40"} ${useLightChrome ? "is-light" : ""}`}
      data-mode={inMenu ? "menu" : "hero"}
      style={{
        backgroundColor: bg,
        borderBottom: `1px solid ${border}`,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
      }}
    >
      <div className="container-page header-bar">
        <Link href="/" className="header-brand" aria-label="BEEFштекс — на главную">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/brand/logo-mark.png" alt="" className="header-logo" />
          <span className="header-brand__name">
            BEEF<span>штекс</span>
          </span>
        </Link>

        {inMenu ? (
          <>
            <div className="header-search min-w-0 flex-1">
              <SearchAutocomplete
                onSelect={(p) => {
                  onSearchSelect?.(p);
                }}
              />
            </div>

            <div className="relative hidden md:block">
              <button
                type="button"
                className="header-addr"
                onClick={() => {
                  setAddrDraft(address === DEFAULT_ADDR ? "" : address);
                  setAddrOpen((v) => !v);
                }}
              >
                <IconPin />
                <span className="max-w-[14rem] truncate">{address}</span>
              </button>
              {addrOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10"
                    aria-label="Закрыть"
                    onClick={() => setAddrOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-2xl border border-white/10 bg-[#1a1a1a] p-3 shadow-xl">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                      Адрес доставки
                    </p>
                    <input
                      value={addrDraft}
                      onChange={(e) => setAddrDraft(e.target.value)}
                      placeholder="Улица, дом / район Коломны"
                      className="header-addr-input"
                    />
                    <button type="button" className="header-addr-save" onClick={saveAddress}>
                      Сохранить
                    </button>
                    <p className="mt-2 text-xs leading-relaxed text-white/40">
                      Курьер по Коломне — 300 ₽, от 2000 ₽ бесплатно. Самовывоз: ТРЦ Рио, фудкорт.
                    </p>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <nav className="header-nav" aria-label="Основное меню">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`header-nav__link ${navActive(item.href) ? "is-active" : ""}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <a href="tel:+79160356777" className="header-phone">
              +7 (916) 035-67-77
            </a>
          </>
        )}

        <div className={`header-actions ${inMenu ? "" : "header-actions--hero"}`}>
          {isSheetPage && !inMenu ? (
            <div className="header-prefs" role="group" aria-label="Language and theme">
              <button
                type="button"
                className="header-pref"
                onClick={toggleLocale}
                aria-label={t("lang")}
              >
                {t("lang")}
              </button>
              <button
                type="button"
                className="header-pref header-pref--icon"
                onClick={toggleColorMode}
                aria-label={colorMode === "dark" ? t("themeToLight") : t("themeToDark")}
              >
                {colorMode === "dark" ? <IconSun /> : <IconMoon />}
              </button>
            </div>
          ) : null}

          {!inMenu ? (
            <button
              type="button"
              className="header-action header-action--nav"
              aria-label={navOpen ? t("closeNav") : t("openNav")}
              aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}
            >
              <IconMenu open={navOpen} />
            </button>
          ) : null}

          {isLoggedIn ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="header-action header-action--user"
                aria-label={t("cabinet")}
              >
                <IconUser />
                <span className="header-action__label">{t("cabinet")}</span>
              </button>
              {menuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10"
                    aria-label="Закрыть меню"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="header-account-menu">
                    {user?.phone ? <p className="header-account-menu__phone">{user.phone}</p> : null}
                    <Link href="/orders" className="header-account-menu__item" onClick={() => setMenuOpen(false)}>
                      Мои заказы
                    </Link>
                    <Link href="/profile" className="header-account-menu__item" onClick={() => setMenuOpen(false)}>
                      Настройки
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="header-account-menu__item header-account-menu__item--danger"
                    >
                      Выйти
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button type="button" onClick={openLogin} className="header-action header-action--user" aria-label={t("login")}>
              <IconUser />
              <span className="header-action__label">{t("login")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCartClick}
            className="header-action header-action--cart"
            aria-label={t("cart")}
            data-cart-target
          >
            <IconCart />
            <span className="header-action__label">{t("cart")}</span>
            {count > 0 ? <span className="header-action__badge">{count}</span> : null}
          </button>
        </div>
      </div>

      {navOpen && !inMenu ? (
        <div className="header-mobile-nav" role="dialog" aria-label="Навигация">
          <button
            type="button"
            className="header-mobile-nav__backdrop"
            aria-label="Закрыть"
            onClick={() => setNavOpen(false)}
          />
          <nav className="header-mobile-nav__panel">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`header-mobile-nav__link ${navActive(item.href) ? "is-active" : ""}`}
                onClick={() => setNavOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <a href="tel:+79160356777" className="header-mobile-nav__phone" onClick={() => setNavOpen(false)}>
              +7 (916) 035-67-77
            </a>
            {isSheetPage ? (
              <button
                type="button"
                className="header-mobile-nav__menu"
                onClick={() => {
                  setNavOpen(false);
                  document.getElementById("menu")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {t("toMenu")}
              </button>
            ) : (
              <Link
                href="/menu"
                className="header-mobile-nav__menu"
                onClick={() => setNavOpen(false)}
              >
                {t("toMenu")}
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
