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
  goToMenu: "Перейти в меню",
  aboutCta: "О нас",
  search: "Найти блюдо",
  login: "Войти",
  cabinet: "Кабинет",
  cart: "Корзина",
  openNav: "Открыть меню",
  closeNav: "Закрыть меню",
  close: "Закрыть",
  lang: "EN",
  themeToLight: "Светлая тема",
  themeToDark: "Тёмная тема",
  slide0Tag: "Мраморная говядина · честные порции",
  slide1Tag: "Двойная котлета и характер",
  slide2Tag: "Бургеры с характером",
  slide0Word: "СОЧНЕЕ",
  slide1Word: "МОЩНЕЕ",
  slide2Word: "БОЛЬШЕ",
  promotions: "Акции",
  copyCode: "Копировать",
  copied: "Скопировано",
  copyPromoAria: "Скопировать промокод",
  categories: "Категории",
  all: "Все",
  filters: "Фильтры",
  sorting: "Сортировка",
  features: "Особенности",
  reset: "Сбросить",
  loadingMenu: "Загружаем меню…",
  nothingFound: "Ничего не нашли",
  sortPopular: "Популярные",
  sortCheap: "Сначала дешевле",
  sortExpensive: "Сначала дороже",
  tagSpicy: "Острое",
  tagVeg: "Вегги",
  tagNew: "Новинка",
  myOrders: "Мои заказы",
  settings: "Настройки",
  logout: "Выйти",
  addToCart: "В корзину",
  adding: "Добавляем…",
  addFailed: "Не удалось добавить",
  footerTag: "Бургеры с характером · Коломна",
  footerAddr: "Коломна, ул. Октябрьской Революции, 362 · ТРЦ Рио, фудкорт",
  openOnMaps: "Открыть BEEFштекс в Яндекс Картах",
  mainNav: "Основное меню",
  footerNav: "Навигация в подвале",
  catalogLabel: "Каталог меню",
  demoBanner: "Демо для заказчика — меню и корзина работают в облаке. Полный заказ/оплата — на следующем этапе.",
  promoFirstOrder: "Первый заказ",
  promoFixed200: "−200 ₽ от 1500 ₽",
  promoSmash: "Смэш",
  promoCombo: "Комбо",
  promoDouble: "Двойной",
  promoSpicy: "Острое",
  grams: "г",
  kcal: "ккал",
  visitUs: "Ждём в гостях",
  everyDay: "каждый день, без выходных",
  contactAndAddress: "Связь и адрес",
  pickup: "Самовывоз",
  callUs: "Позвонить",
  blogTitle: "Новости и вкус",
  blogLead: "Рецепты, доставка и всё, что происходит вокруг BEEFштекс.",
  readMore: "Читать",
  articleNotFound: "Статья не найдена",
  loginTitle: "Вход по телефону",
  loginPhoneHint: "Введите номер — пришлём SMS с кодом",
  loginCodeHint: "Код отправлен на",
  phone: "Телефон",
  getCode: "Получить код",
  sendingCode: "Отправляем…",
  checkingCode: "Проверяем…",
  changePhone: "Изменить номер",
  otpSendFail: "Не удалось отправить код",
  otpInvalid: "Неверный код",
  cartEmpty: "Корзина пуста",
  remove: "Удалить",
  total: "Итого",
  openCart: "Перейти в корзину",
  checkout: "Оформить заказ",
} as const;

const EN: Record<keyof typeof RU, string> = {
  home: "Home",
  about: "About",
  contacts: "Contacts",
  blog: "Blog",
  menu: "Menu",
  toMenu: "To menu",
  goToMenu: "Go to menu",
  aboutCta: "About us",
  search: "Search dishes",
  login: "Sign in",
  cabinet: "Account",
  cart: "Cart",
  openNav: "Open menu",
  closeNav: "Close menu",
  close: "Close",
  lang: "RU",
  themeToLight: "Light theme",
  themeToDark: "Dark theme",
  slide0Tag: "Marble beef · honest portions",
  slide1Tag: "Double patty with character",
  slide2Tag: "Burgers with attitude",
  slide0Word: "JUICIER",
  slide1Word: "BOLDER",
  slide2Word: "BIGGER",
  promotions: "Promotions",
  copyCode: "Copy",
  copied: "Copied",
  copyPromoAria: "Copy promo code",
  categories: "Categories",
  all: "All",
  filters: "Filters",
  sorting: "Sorting",
  features: "Features",
  reset: "Reset",
  loadingMenu: "Loading menu…",
  nothingFound: "Nothing found",
  sortPopular: "Popular",
  sortCheap: "Price: low to high",
  sortExpensive: "Price: high to low",
  tagSpicy: "Spicy",
  tagVeg: "Veggie",
  tagNew: "New",
  myOrders: "My orders",
  settings: "Settings",
  logout: "Sign out",
  addToCart: "Add to cart",
  adding: "Adding…",
  addFailed: "Couldn’t add to cart",
  footerTag: "Burgers with attitude · Kolomna",
  footerAddr: "Kolomna, Oktyabrskoy Revolutsii St. 362 · Rio mall food court",
  openOnMaps: "Open BEEFshteks on Yandex Maps",
  mainNav: "Main navigation",
  footerNav: "Footer navigation",
  catalogLabel: "Menu catalog",
  demoBanner: "Client demo — menu and cart run in the cloud. Full checkout comes next.",
  promoFirstOrder: "First order",
  promoFixed200: "−200 ₽ from 1500 ₽",
  promoSmash: "Smash",
  promoCombo: "Combo",
  promoDouble: "Double",
  promoSpicy: "Spicy",
  grams: "g",
  kcal: "kcal",
  visitUs: "Come visit us",
  everyDay: "every day, no days off",
  contactAndAddress: "Contact & address",
  pickup: "Pickup",
  callUs: "Call us",
  blogTitle: "News & flavor",
  blogLead: "Recipes, delivery tips, and everything around BEEFshteks.",
  readMore: "Read",
  articleNotFound: "Article not found",
  loginTitle: "Sign in with phone",
  loginPhoneHint: "Enter your number — we’ll text you a code",
  loginCodeHint: "Code sent to",
  phone: "Phone",
  getCode: "Get code",
  sendingCode: "Sending…",
  checkingCode: "Checking…",
  changePhone: "Change number",
  otpSendFail: "Couldn’t send the code",
  otpInvalid: "Invalid code",
  cartEmpty: "Your cart is empty",
  remove: "Remove",
  total: "Total",
  openCart: "Open cart",
  checkout: "Checkout",
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
