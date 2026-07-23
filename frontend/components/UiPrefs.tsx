"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Locale = "ru" | "en";
export type ColorMode = "dark" | "light";

type UiPrefs = {
  locale: Locale;
  colorMode: ColorMode;
  setLocale: (locale: Locale) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleLocale: () => void;
  toggleColorMode: () => void;
  t: (key: keyof typeof RU) => string;
};

const LOCALE_KEY = "beefshteks_locale";
const THEME_KEY = "beefshteks_theme";

const RU = {
  home: "Главная",
  about: "О нас",
  contacts: "Контакты",
  blog: "Блог",
  menu: "Меню",
  toMenu: "К меню",
  aboutCta: "О нас",
  search: "Найти блюдо",
  login: "Войти",
  cabinet: "Кабинет",
  cart: "Корзина",
  openNav: "Открыть меню",
  closeNav: "Закрыть меню",
  lang: "EN",
  themeToLight: "Светлая тема",
  themeToDark: "Тёмная тема",
  slide0Tag: "Мраморная говядина · честные порции",
  slide1Tag: "Двойная котлета и характер",
  slide2Tag: "Бургеры с характером",
  slide0Word: "СОЧНЕЕ",
  slide1Word: "МОЩНЕЕ",
  slide2Word: "БОЛЬШЕ",
} as const;

const EN: Record<keyof typeof RU, string> = {
  home: "Home",
  about: "About",
  contacts: "Contacts",
  blog: "Blog",
  menu: "Menu",
  toMenu: "To menu",
  aboutCta: "About",
  search: "Search dishes",
  login: "Sign in",
  cabinet: "Account",
  cart: "Cart",
  openNav: "Open menu",
  closeNav: "Close menu",
  lang: "RU",
  themeToLight: "Light theme",
  themeToDark: "Dark theme",
  slide0Tag: "Marble beef · honest portions",
  slide1Tag: "Double patty with character",
  slide2Tag: "Burgers with attitude",
  slide0Word: "JUICIER",
  slide1Word: "BOLDER",
  slide2Word: "BIGGER",
};

const UiPrefsContext = createContext<UiPrefs | null>(null);

function applyDom(locale: Locale, colorMode: ColorMode) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale === "en" ? "en" : "ru";
  document.documentElement.dataset.theme = colorMode;
  document.documentElement.dataset.locale = locale;
}

export function UiPrefsProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ru");
  const [colorMode, setColorModeState] = useState<ColorMode>("dark");

  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem(LOCALE_KEY);
      const savedTheme = localStorage.getItem(THEME_KEY);
      const nextLocale: Locale = savedLocale === "en" ? "en" : "ru";
      const nextTheme: ColorMode = savedTheme === "light" ? "light" : "dark";
      setLocaleState(nextLocale);
      setColorModeState(nextTheme);
      applyDom(nextLocale, nextTheme);
    } catch {
      applyDom("ru", "dark");
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setColorModeState((mode) => {
      try {
        localStorage.setItem(LOCALE_KEY, next);
      } catch {
        /* ignore */
      }
      applyDom(next, mode);
      return mode;
    });
  }, []);

  const setColorMode = useCallback((next: ColorMode) => {
    setColorModeState(next);
    setLocaleState((loc) => {
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* ignore */
      }
      applyDom(loc, next);
      return loc;
    });
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "ru" ? "en" : "ru");
  }, [locale, setLocale]);

  const toggleColorMode = useCallback(() => {
    setColorMode(colorMode === "dark" ? "light" : "dark");
  }, [colorMode, setColorMode]);

  const t = useCallback(
    (key: keyof typeof RU) => (locale === "en" ? EN[key] : RU[key]),
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      colorMode,
      setLocale,
      setColorMode,
      toggleLocale,
      toggleColorMode,
      t,
    }),
    [locale, colorMode, setLocale, setColorMode, toggleLocale, toggleColorMode, t]
  );

  return <UiPrefsContext.Provider value={value}>{children}</UiPrefsContext.Provider>;
}

export function useUiPrefs() {
  const ctx = useContext(UiPrefsContext);
  if (!ctx) {
    throw new Error("useUiPrefs must be used within UiPrefsProvider");
  }
  return ctx;
}
