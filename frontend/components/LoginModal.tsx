"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { sendOtp, verifyOtp } from "@/lib/auth";
import { useAuth } from "@/components/AuthProvider";

type Step = "phone" | "otp";

export default function LoginModal() {
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
      setError(err instanceof Error ? err.message : "Не удалось отправить код");
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
      setError(err instanceof Error ? err.message : "Неверный код");
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Закрыть"
        onClick={closeLogin}
      />
      <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl">
        <button
          type="button"
          onClick={closeLogin}
          className="absolute right-4 top-4 text-muted hover:text-ink"
          aria-label="Закрыть"
        >
          ✕
        </button>

        <h2 id="login-title" className="mb-1 text-2xl font-bold text-ink">
          Вход
        </h2>
        <p className="mb-6 text-sm text-muted">
          {step === "phone"
            ? "Введите номер телефона — отправим SMS с кодом"
            : `Код отправлен на ${phone}`}
        </p>

        {step === "phone" ? (
          <form onSubmit={onSendOtp} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Телефон</label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                pattern="\+7\d{10}"
                className="w-full rounded-xl border border-stone-200 px-4 py-3 text-lg"
                placeholder="+79001234567"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-terracotta py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Отправляем…" : "Получить код"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center gap-3">
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
                  className="h-14 w-12 rounded-xl border border-stone-200 text-center text-2xl font-bold focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                  aria-label={`Цифра ${i + 1}`}
                />
              ))}
            </div>
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            {loading && <p className="text-center text-sm text-muted">Проверяем…</p>}
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode(["", "", "", ""]);
              }}
              className="w-full text-sm text-terracotta hover:underline"
            >
              Изменить номер
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
