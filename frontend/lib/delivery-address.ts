import type { SavedAddress } from "@/lib/types";

export const CURRENT_ADDR_KEY = "beefshteks_delivery_address";
export const SAVED_ADDR_KEY = "beefshteks_saved_addresses";
export const DEFAULT_ADDR = "Коломна · доставка / самовывоз";

const FALLBACK_SAVED: SavedAddress[] = [
  {
    id: "local-rio",
    label: "Самовывоз",
    address: "Коломна, ул. Октябрьской Революции, 362, ТРЦ Рио",
  },
];

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
    return Array.isArray(parsed) && parsed.length ? parsed : FALLBACK_SAVED;
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

/** Kolomna-focused fallback when geocoder API is offline (demo). */
export function fallbackSuggest(query: string): string[] {
  const q = query.trim().toLowerCase();
  const base = [
    "Коломна, ул. Октябрьской Революции, 362",
    "Коломна, Советская площадь, 1",
    "Коломна, ул. Октябрьской Революции, 314",
    "Коломна, проспект Кирова, 15",
    "Коломна, ул. Гагарина, 2",
    "Коломна, ул. Ленина, 78",
    "Коломна, ул. Гражданская, 12",
    "Коломна, ул. Астанатьева, 45",
  ];
  if (q.length < 2) return base.slice(0, 4);
  return base.filter((a) => a.toLowerCase().includes(q)).slice(0, 6);
}

export const MAP_WIDGET_SRC =
  "https://yandex.ru/map-widget/v1/?ll=38.800483%2C55.084059&z=15&pt=38.800483,55.084059,pm2rdm";
