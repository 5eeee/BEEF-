"use client";

import { useEffect, useId, useState } from "react";
import { fetchUserAddresses, suggestAddress } from "@/lib/api";
import {
  DEFAULT_ADDR,
  MAP_WIDGET_SRC,
  fallbackSuggest,
  mergeAddressLists,
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
};

export default function DeliveryAddressModal({ open, onClose, onConfirm }: Props) {
  const titleId = useId();
  const [step, setStep] = useState<Step>("pick");
  const [query, setQuery] = useState("");
  const [mapQuery, setMapQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [saved, setSaved] = useState<SavedAddress[]>([]);

  useEffect(() => {
    if (!open) return;
    setStep("pick");
    const current = readCurrentAddress();
    setQuery("");
    setMapQuery(current === DEFAULT_ADDR ? "" : current);
    setSuggestions([]);
    const local = readSavedAddresses();
    setSaved(local);
    fetchUserAddresses()
      .then((api) => setSaved(mergeAddressLists(api, local)))
      .catch(() => setSaved(local));
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open || step !== "map") return;
    const q = mapQuery.trim();
    if (q.length < 2) {
      setSuggestions(fallbackSuggest(""));
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      suggestAddress(q)
        .then((list) => {
          if (cancelled) return;
          setSuggestions(list.length ? list : fallbackSuggest(q));
        })
        .catch(() => {
          if (!cancelled) setSuggestions(fallbackSuggest(q));
        });
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [mapQuery, open, step]);

  if (!open) return null;

  const confirm = (address: string) => {
    const next = address.trim();
    if (!next) return;
    writeCurrentAddress(next);
    rememberAddress(next);
    onConfirm(next);
    onClose();
  };

  return (
    <div className="addr-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="addr-modal__backdrop" aria-label="Закрыть" onClick={onClose} />

      <div className={`addr-modal__panel addr-modal__panel--${step}`}>
        {step === "pick" ? (
          <>
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
              <button
                type="button"
                className="addr-modal__pick-input"
                onClick={() => {
                  setStep("map");
                  setMapQuery(query);
                }}
              >
                <span className={query ? "" : "is-placeholder"}>{query || "Куда доставить?"}</span>
              </button>
              <button
                type="button"
                className="addr-modal__go"
                aria-label="Указать на карте"
                onClick={() => {
                  setStep("map");
                  setMapQuery(query);
                }}
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

            <ul className="addr-modal__saved">
              {saved.map((a) => (
                <li key={a.id}>
                  <button type="button" className="addr-modal__saved-item" onClick={() => confirm(a.address)}>
                    <span className="addr-modal__dot" aria-hidden />
                    <span className="addr-modal__saved-copy">
                      <strong>{a.label || a.address}</strong>
                      {a.label ? <span>{a.address}</span> : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {!saved.length ? (
              <p className="addr-modal__empty">Сохранённых адресов пока нет — укажите новый на карте.</p>
            ) : null}

            <p className="addr-modal__note">Адреса запоминаются в личном кабинете на этом устройстве.</p>
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

            {suggestions.length ? (
              <ul className="addr-modal__suggest">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button type="button" onClick={() => setMapQuery(s)}>
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
              ← К сохранённым адресам
            </button>
          </>
        )}
      </div>
    </div>
  );
}
