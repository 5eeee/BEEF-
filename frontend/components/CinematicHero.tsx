"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUiPrefs } from "@/components/UiPrefs";

const SOCIAL = [
  { href: "https://t.me/BEEFshteksDelivery", label: "Telegram", id: "tg", icon: "/images/social/telegram.svg" },
  { href: "https://vk.com/beefshtekskolomna", label: "VKontakte", id: "vk", icon: "/images/social/vk.svg" },
  { href: "https://www.instagram.com/beefshteks_burgers/", label: "Instagram", id: "ig", icon: "/images/social/instagram.svg" },
] as const;

function renderWordPart(text: string, allowLogo: boolean) {
  let usedLogo = !allowLogo;
  return text.split("").map((ch, i) => {
    if (!usedLogo && (ch === "О" || ch === "о" || ch === "O" || ch === "o")) {
      usedLogo = true;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${ch}-${i}`}
          src="/images/brand/logo-mark.png"
          alt=""
          className="cinema-hero__word-logo"
          draggable={false}
        />
      );
    }
    return (
      <span key={`${ch}-${i}`} className="cinema-hero__word-ch">
        {ch}
      </span>
    );
  });
}

const AUTO_MS = 5200;

type Tilt = { x: number; y: number };

export default function CinematicHero() {
  const { t } = useUiPrefs();
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [slide, setSlide] = useState(0);
  const [mouse, setMouse] = useState<Tilt>({ x: 0, y: 0 });
  const [reduce, setReduce] = useState(false);
  const [scroll, setScroll] = useState(0);
  const [compact, setCompact] = useState(false);

  const slides = useMemo(
    () =>
      [
        { word: t("slide0Word"), tag: t("slide0Tag") },
        { word: t("slide1Word"), tag: t("slide1Tag") },
        { word: t("slide2Word"), tag: t("slide2Tag") },
      ] as const,
    [t]
  );

  const next = useCallback(() => setSlide((s) => (s + 1) % slides.length), [slides.length]);

  useEffect(() => {
    const tmr = window.setTimeout(() => setReady(true), 80);
    return () => clearTimeout(tmr);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    if (mq.matches) return;

    let raf = 0;
    let target: Tilt = { x: 0, y: 0 };
    let usingGyro = false;
    let gyroBound = false;

    const tick = () => {
      setMouse((prev) => {
        const nx = prev.x + (target.x - prev.x) * 0.05;
        const ny = prev.y + (target.y - prev.y) * 0.05;
        if (Math.abs(nx - prev.x) < 0.0015 && Math.abs(ny - prev.y) < 0.0015) return prev;
        return { x: nx, y: ny };
      });
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      if (usingGyro) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      target = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      };
    };

    const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

    const onOrientation = (e: DeviceOrientationEvent) => {
      usingGyro = true;
      const gamma = typeof e.gamma === "number" ? e.gamma : 0;
      const beta = typeof e.beta === "number" ? e.beta : 45;
      target = {
        x: clamp(gamma / 40, -1.15, 1.15),
        y: clamp((beta - 45) / 40, -1.15, 1.15),
      };
    };

    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setScroll(Math.min(1, Math.max(0, -rect.top / Math.max(rect.height * 0.85, 1))));
    };

    const enableGyro = async () => {
      if (gyroBound) return;
      gyroBound = true;
      const DOE = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied" | "default">;
      };
      try {
        if (typeof DOE.requestPermission === "function") {
          const permission = await DOE.requestPermission();
          if (permission !== "granted") {
            gyroBound = false;
            return;
          }
        }
        window.addEventListener("deviceorientation", onOrientation, { passive: true });
      } catch {
        gyroBound = false;
      }
    };

    raf = requestAnimationFrame(tick);
    onScroll();
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    const isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
    if (isTouch) {
      const DOE = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied" | "default">;
      };
      if (typeof DOE.requestPermission !== "function") {
        void enableGyro();
      }
    }

    const onFirstTap = () => {
      void enableGyro();
    };
    window.addEventListener("touchend", onFirstTap, { passive: true, once: true });
    window.addEventListener("click", onFirstTap, { once: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("touchend", onFirstTap);
      window.removeEventListener("click", onFirstTap);
    };
  }, []);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(next, AUTO_MS);
    return () => clearInterval(id);
  }, [next, reduce]);

  useEffect(() => {
    setSlide((s) => Math.min(s, slides.length - 1));
  }, [slides.length]);

  const mx = reduce ? 0 : mouse.x;
  const my = reduce ? 0 : mouse.y;
  const sc = reduce ? 0 : scroll;
  const textX = mx * -18 + sc * -24;
  const textY = my * -8 + sc * 18;
  const burgerX = mx * (compact ? 36 : 22);
  const burgerY = my * (compact ? 28 : 14) + sc * -12;
  const burgerRot = mx * (compact ? 7 : 2.5) + my * (compact ? 3 : 0);
  const burgerScale = ready ? 1 : 0.72;

  return (
    <section
      ref={ref}
      className={`cinema-hero ${ready ? "is-ready" : ""} ${compact ? "is-compact" : ""}`}
      aria-label="Главный экран"
    >
      <div className="cinema-hero__vignette" aria-hidden />
      <div className="cinema-hero__glow" aria-hidden />

      <div
        className="cinema-hero__type"
        style={{ transform: `translate3d(${textX}px, ${textY}px, 0)` }}
        aria-hidden
      >
        {slides.map((s, i) => {
          if (compact) {
            return (
              <div
                key={`${s.word}-${i}`}
                className={`cinema-hero__word cinema-hero__word--solid ${i === slide ? "is-active" : ""}`}
              >
                <span className="cinema-hero__word-full">{renderWordPart(s.word, true)}</span>
              </div>
            );
          }
          const h = Math.ceil(s.word.length / 2);
          const left = s.word.slice(0, h);
          const right = s.word.slice(h);
          const logoInLeft = /[ОоOo]/.test(left);
          return (
            <div
              key={`${s.word}-${i}`}
              className={`cinema-hero__word ${i === slide ? "is-active" : ""}`}
            >
              <span className="cinema-hero__word-left">{renderWordPart(left, true)}</span>
              <span className="cinema-hero__word-gap" />
              <span className="cinema-hero__word-right">{renderWordPart(right, !logoInLeft)}</span>
            </div>
          );
        })}
      </div>

      <div
        className="cinema-hero__burger-wrap"
        style={{
          opacity: ready ? 1 : 0,
          transform: `translate(calc(-50% + ${burgerX}px), calc(-50% + ${burgerY}px)) rotate(${burgerRot}deg) scale(${burgerScale})`,
        }}
      >
        <div className="cinema-hero__burger-shadow" aria-hidden />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero/hero-king-kong.png"
          alt="Кинг Конг — бургер BEEFштекс"
          className="cinema-hero__burger"
          draggable={false}
          width={900}
          height={900}
          decoding="async"
          fetchPriority="high"
        />
      </div>

      <div className="cinema-hero__under">
        <p className="cinema-hero__tagline">{slides[slide].tag}</p>
        <button
          type="button"
          className="cinema-hero__menu-btn"
          onClick={() => {
            document.getElementById("menu")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          {t("menu")}
        </button>
      </div>

      <div className="cinema-hero__foot">
        <div className="cinema-hero__social">
          {SOCIAL.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              aria-label={s.label}
              className={`cinema-hero__social-link cinema-hero__social-link--${s.id}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.icon} alt="" width={40} height={40} draggable={false} />
            </a>
          ))}
        </div>

        <div className="cinema-hero__foot-spacer" aria-hidden />

        <Link href="/about" className="cinema-hero__more">
          {t("aboutCta")} <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
