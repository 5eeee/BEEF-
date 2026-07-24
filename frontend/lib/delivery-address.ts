import type { SavedAddress } from "@/lib/types";

export const CURRENT_ADDR_KEY = "beefshteks_delivery_address";
export const SAVED_ADDR_KEY = "beefshteks_saved_addresses";
export const DEFAULT_ADDR = "Укажите адрес доставки";

const KOLOMNA_STREETS = [
  "ул. Октябрьской Революции",
  "Советская площадь",
  "пр-т Кирова",
  "ул. Гагарина",
  "ул. Ленина",
  "ул. Гражданская",
  "ул. Астанатьева",
  "ул. Островского",
  "ул. Зеленая",
  "ул. Малышева",
  "ул. Дзержинского",
  "ул. Яна Грунта",
  "ул. Толстикова",
  "ул. Осипенко",
  "ул. Красногвардейская",
  "ул. Савельича",
  "ул. Коломенская",
  "ул. Зайцева",
  "ул. Комсомольская",
  "ул. Пушкина",
  "ул. Чайковского",
  "ул. Советская",
  "ул. Москворецкая",
  "ул. Арбатская",
  "пер. Водовозный",
  "ул. Уманская",
  "ул. Спирина",
  "ш. Озёрское",
  "ул. Весенняя",
  "ул. Голутвинская",
];

const HOUSES = ["1", "2", "3", "5", "7", "9", "10", "12", "15", "18", "21", "23", "25", "28", "32", "45", "62", "78", "112", "314", "362"];

function buildCatalog(): string[] {
  const out: string[] = [];
  for (const street of KOLOMNA_STREETS) {
    out.push(`Коломна, ${street}`);
    for (const h of HOUSES.slice(0, 8)) {
      out.push(`Коломна, ${street}, ${h}`);
    }
  }
  // Popular spots
  out.unshift(
    "Коломна, ул. Октябрьской Революции, 362, ТРЦ Рио",
    "Коломна, ул. Октябрьской Революции, 314",
    "Коломна, Советская площадь, 1",
    "Коломна, пр-т Кирова, 15"
  );
  return out;
}

const ADDRESS_CATALOG = buildCatalog();

const FALLBACK_SAVED: SavedAddress[] = [];

export function readCurrentAddress(): string {
  try {
    return localStorage.getItem(CURRENT_ADDR_KEY) || DEFAULT_ADDR;
  } catch {
    return DEFAULT_ADDR;
  }
}

export function writeCurrentAddress(address: string) {
  try {
    localStorage.setItem(CURRENT_ADDR_KEY, address);
  } catch {
    /* ignore */
  }
}

export function readSavedAddresses(): SavedAddress[] {
  try {
    const raw = localStorage.getItem(SAVED_ADDR_KEY);
    if (!raw) return FALLBACK_SAVED;
    const parsed = JSON.parse(raw) as SavedAddress[];
    return Array.isArray(parsed) ? parsed : FALLBACK_SAVED;
  } catch {
    return FALLBACK_SAVED;
  }
}

export function writeSavedAddresses(list: SavedAddress[]) {
  try {
    localStorage.setItem(SAVED_ADDR_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/** Remember address in cabinet list (newest first, de-duped). */
export function rememberAddress(address: string, label?: string): SavedAddress[] {
  const trimmed = address.trim();
  if (!trimmed || trimmed === DEFAULT_ADDR) return readSavedAddresses();
  const prev = readSavedAddresses().filter((a) => a.address !== trimmed);
  const next: SavedAddress[] = [
    { id: `local-${Date.now()}`, label: label || undefined, address: trimmed },
    ...prev,
  ].slice(0, 8);
  writeSavedAddresses(next);
  return next;
}

export function mergeAddressLists(api: SavedAddress[], local: SavedAddress[]): SavedAddress[] {
  const seen = new Set<string>();
  const out: SavedAddress[] = [];
  for (const a of [...api, ...local]) {
    const key = a.address.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out.slice(0, 10);
}

/** Local Kolomna autocomplete — works without backend. */
export function fallbackSuggest(query: string): string[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, " ");
  if (!q) {
    return [
      "Коломна, ул. Октябрьской Революции, 362, ТРЦ Рио",
      "Коломна, ул. Октябрьской Революции, 314",
      "Коломна, Советская площадь, 1",
      "Коломна, пр-т Кирова, 15",
      "Коломна, ул. Гагарина, 2",
      "Коломна, ул. Ленина, 78",
    ];
  }

  const tokens = q.split(" ").filter(Boolean);
  const scored = ADDRESS_CATALOG.map((addr) => {
    const low = addr.toLowerCase();
    let score = 0;
    if (low.startsWith(q) || low.includes(`, ${q}`)) score += 40;
    if (low.includes(q)) score += 25;
    for (const t of tokens) {
      if (low.includes(t)) score += 8;
    }
    // Prefer fuller addresses (with house) when query has digits
    if (/\d/.test(q) && /\d/.test(addr)) score += 10;
    if (!/\d/.test(q) && !/\d/.test(addr.split(",").pop() || "")) score += 3;
    return { addr, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.addr.length - b.addr.length);

  const uniq: string[] = [];
  for (const { addr } of scored) {
    if (!uniq.includes(addr)) uniq.push(addr);
    if (uniq.length >= 8) break;
  }
  return uniq;
}

export const MAP_WIDGET_SRC =
  "https://yandex.ru/map-widget/v1/?ll=38.800483%2C55.084059&z=15&pt=38.800483,55.084059,pm2rdm";
