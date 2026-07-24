"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { sendOtp, verifyOtp } from "@/lib/auth";
import { useAuth } from "@/components/AuthProvider";
import { useUiPrefs } from "@/components/UiPrefs";

type Step = "phone" | "otp";

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginModal() {
  const { t } = useUiPrefs();
  const { loginOpen, closeLogin, refreshUser } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+7");
  const [code, setCode] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!loginOpen) {
      setStep("phone");
      setPhone("+7");
      setCode(["", "", "", ""]);
      setError("");
    }
  }, [loginOpen]);

  useEffect(() => {
    if (!loginOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [loginOpen]);

  if (!loginOpen) return null;

  const onSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendOtp(phone);
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("otpSendFail"));
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (digits: string[]) => {
    const otp = digits.join("");
    if (otp.length !== 4) return;
    setError("");
    setLoading(true);
    try {
      await verifyOtp(phone, otp);
      await refreshUser();
      closeLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("otpInvalid"));
      setCode(["", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 3) otpRefs.current[index + 1]?.focus();
    if (next.every((d) => d)) onVerify(next);
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="beef-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <button type="button" className="beef-modal-overlay__backdrop" aria-label={t("close")} onClick={closeLogin} />
      <div className="beef-modal login-modal">
        <button type="button" className="beef-modal__close" onClick={closeLogin} aria-label={t("close")}>
          <CloseIcon />
        </button>

        <div className="login-modal__brand" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/brand/logo-mark.png" alt="" />
        </div>

        <h2 id="login-title" className="beef-modal__title">
          {t("loginTitle")}
        </h2>
        <p className="beef-modal__lead">
          {step === "phone" ? t("loginPhoneHint") : `${t("loginCodeHint")} ${phone}`}
        </p>

        {step === "phone" ? (
          <form onSubmit={onSendOtp} className="login-modal__form">
            <label className="beef-modal__label" htmlFor="login-phone">
              {t("phone")}
            </label>
            <input
              id="login-phone"
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              pattern="\+7\d{10}"
              className="beef-modal__input"
              placeholder="+79001234567"
              autoFocus
            />
            {error ? <p className="beef-modal__error">{error}</p> : null}
            <button type="submit" disabled={loading} className="beef-modal__primary">
              {loading ? t("sendingCode") : t("getCode")}
            </button>
          </form>
        ) : (
          <div className="login-modal__otp">
            <div className="login-modal__digits">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="login-modal__digit"
                  aria-label={`${i + 1}`}
                />
              ))}
            </div>
            {error ? <p className="beef-modal__error beef-modal__error--center">{error}</p> : null}
            {loading ? <p className="beef-modal__hint">{t("checkingCode")}</p> : null}
            <button
              type="button"
              className="beef-modal__link"
              onClick={() => {
                setStep("phone");
                setCode(["", "", "", ""]);
              }}
            >
              {t("changePhone")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
