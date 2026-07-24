"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
  DEFAULT_ADDR,
  MAP_WIDGET_SRC,
  fallbackSuggest,
  readCurrentAddress,
  readSavedAddresses,
  rememberAddress,
  writeCurrentAddress,
} from "@/lib/delivery-address";
import type { SavedAddress } from "@/lib/types";

type Step = "pick" | "map";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (address: string) => void;
  /** Anchor the popover under this element (header address button). */
  anchorRef?: RefObject<HTMLElement | null>;
};

type Pos = { top: number; left: number; width: number };

export default function DeliveryAddressModal({ open, onClose, onConfirm, anchorRef }: Props) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>("pick");
  const [query, setQuery] = useState("");
  const [mapQuery, setMapQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const place = () => {
    const el = anchorRef?.current;
    if (!el || typeof window === "undefined") return;
    const r = el.getBoundingClientRect();
    const mobile = window.innerWidth <= 640;
    setIsMobile(mobile);
    if (mobile) {
      setPos(null);
      return;
    }
    const width = Math.min(step === "map" ? 480 : 420, window.innerWidth - 16);
    let left = r.right - width;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    let top = r.bottom + 10;
    const maxH = Math.min(window.innerHeight * 0.82, step === "map" ? 580 : 500);
    if (top + maxH > window.innerHeight - 8) {
      top = Math.max(8, r.top - maxH - 8);
    }
    setPos({ top, left, width });
  };

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onScroll = () => place();
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, anchorRef]);

  useEffect(() => {
    if (!open) return;
    setStep("pick");
    const current = readCurrentAddress();
    setQuery("");
    setMapQuery(current === DEFAULT_ADDR ? "" : current);
    setSuggestions([]);
    setShowSuggest(false);
    setSaved(readSavedAddresses());
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open || step !== "pick") return;
    const q = query.trim();
    if (q.length < 1) {
      setSuggestions([]);
      return;
    }
    const t = window.setTimeout(() => {
      setSuggestions(fallbackSuggest(q));
      setShowSuggest(true);
    }, 120);
    return () => window.clearTimeout(t);
  }, [query, open, step]);

  useEffect(() => {
    if (!open || step !== "map") return;
    const q = mapQuery.trim();
    const t = window.setTimeout(() => {
      setSuggestions(fallbackSuggest(q));
      setShowSuggest(q.length > 0);
    }, 120);
    return () => window.clearTimeout(t);
  }, [mapQuery, open, step]);

  if (!open) return null;

  const confirm = (address: string) => {
    const next = address.trim();
    if (!next) return;
    writeCurrentAddress(next);
    const list = rememberAddress(next);
    setSaved(list);
    onConfirm(next);
    onClose();
  };

  const openMap = (seed = query) => {
    setMapQuery(seed.trim());
    setStep("map");
    setShowSuggest(false);
  };

  return (
    <div className={`addr-modal ${isMobile ? "is-mobile" : "is-popover"}`} role="presentation">
      <button type="button" className="addr-modal__backdrop" aria-label="Закрыть" onClick={onClose} />

      <div
        ref={panelRef}
        className={`addr-modal__panel addr-modal__panel--${step}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={
          !isMobile && pos
            ? { top: pos.top, left: pos.left, width: pos.width, position: "fixed" }
            : undefined
        }
      >
        {step === "pick" ? (
          <>
            <h2 id={titleId} className="addr-modal__pick-title">
              Куда доставить?
            </h2>

            <div className="addr-modal__pick-field">
              <span className="addr-modal__pin" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11z"
                    fill="currentColor"
                  />
                  <circle cx="12" cy="10" r="2.2" fill="#111" />
                </svg>
              </span>
              <input
                ref={inputRef}
                className="addr-modal__pick-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (query.trim()) {
                    setSuggestions(fallbackSuggest(query));
                    setShowSuggest(true);
                  }
                }}
                placeholder="Начните вводить улицу или дом…"
                autoComplete="off"
              />
              <button
                type="button"
                className="addr-modal__go"
                aria-label="Открыть карту"
                onClick={() => openMap(query)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M9 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {showSuggest && suggestions.length > 0 ? (
              <ul className="addr-modal__suggest addr-modal__suggest--pick" role="listbox">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(s);
                        setShowSuggest(false);
                        confirm(s);
                      }}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {saved.length > 0 ? (
              <>
                <p className="addr-modal__section">Сохранённые</p>
                <ul className="addr-modal__saved">
                  {saved.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        className="addr-modal__saved-item"
                        onClick={() => confirm(a.address)}
                      >
                        <span className="addr-modal__dot" aria-hidden />
                        <span className="addr-modal__saved-copy">
                          <strong>{a.label || a.address}</strong>
                          {a.label ? <span>{a.address}</span> : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="addr-modal__empty">
                Начните печатать — появятся улицы Коломны. Выбранные адреса сохранятся здесь.
              </p>
            )}

            <button type="button" className="addr-modal__map-cta" onClick={() => openMap(query)}>
              <span className="addr-modal__map-cta-icon" aria-hidden>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4.5 8.5 12 4l7.5 4.5v9L12 22l-7.5-4.5v-9z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 12.5a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path d="M12 12.5V18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </span>
              <span className="addr-modal__map-cta-copy">
                <strong>Указать на карте</strong>
                <span>Выбрать точку доставки</span>
              </span>
              <span className="addr-modal__map-cta-arrow" aria-hidden>
                →
              </span>
            </button>
          </>
        ) : (
          <>
            <header className="addr-modal__map-head">
              <h2 id={titleId} className="addr-modal__map-title">
                Куда доставить заказ?
              </h2>
              <button type="button" className="addr-modal__close" aria-label="Закрыть" onClick={onClose}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <div className="addr-modal__map-row">
              <label className="addr-modal__search">
                <span className="addr-modal__search-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M16.2 16.2L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  value={mapQuery}
                  onChange={(e) => setMapQuery(e.target.value)}
                  placeholder="Улица, дом — Коломна"
                  autoFocus
                  autoComplete="off"
                />
                {mapQuery ? (
                  <button
                    type="button"
                    className="addr-modal__clear"
                    aria-label="Очистить"
                    onClick={() => setMapQuery("")}
                  >
                    ×
                  </button>
                ) : null}
              </label>
              <button
                type="button"
                className="addr-modal__ok"
                disabled={!mapQuery.trim()}
                onClick={() => confirm(mapQuery)}
              >
                Ок
              </button>
            </div>

            {showSuggest && suggestions.length ? (
              <ul className="addr-modal__suggest">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => {
                        setMapQuery(s);
                        setShowSuggest(false);
                      }}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="addr-modal__map-wrap">
              <iframe
                className="addr-modal__map"
                title="Карта доставки — Коломна"
                src={MAP_WIDGET_SRC}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            <button type="button" className="addr-modal__back" onClick={() => setStep("pick")}>
              ← Назад
            </button>
          </>
        )}
      </div>
    </div>
  );
}
