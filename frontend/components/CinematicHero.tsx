"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUiPrefs } from "@/components/UiPrefs";

const SOCIAL = [
  { href: "https://t.me/BEEFshteksDelivery", label: "Telegram", id: "tg", icon: "/images/social/telegram.svg" },
  { href: "https://vk.com/beefshtekskolomna", label: "VKontakte", id: "vk", icon: "/images/social/vk.svg" },
  { href: "https://www.instagram.com/beefshteks_burgers/", label: "Instagram", id: "ig", icon: "/images/social/instagram.svg" },
] as const;

function renderWordPart(text: string) {
  return text.split("").map((ch, i) => (
    <span key={`${ch}-${i}`} className="cinema-hero__word-ch">
      {ch}
    </span>
  ));
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
      // Mouse always wins on desktop / after theme toggle clicks
      usingGyro = false;
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
      if (typeof e.gamma !== "number" || typeof e.beta !== "number") return;
      usingGyro = true;
      const gamma = e.gamma;
      const beta = e.beta;
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
      if (typeof DeviceOrientationEvent === "undefined") return;
      // Gyro only on touch / coarse pointers — theme button clicks on desktop must not steal cursor parallax
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      if (!coarse) return;
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

    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch && typeof DeviceOrientationEvent !== "undefined") {
      const DOE = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied" | "default">;
      };
      if (typeof DOE.requestPermission !== "function") {
        void enableGyro();
      } else {
        window.addEventListener("touchend", () => void enableGyro(), { passive: true, once: true });
      }
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("deviceorientation", onOrientation);
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

      {/* Logo on the furthest back plane (below text and burger) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/brand/logo-mark.png"
        alt=""
        className="cinema-hero__burger-logo"
        aria-hidden
        draggable={false}
        style={{
          transform: `translate3d(calc(-50% + ${burgerX * 0.25}px), calc(-50% + ${burgerY * 0.25}px), 0)`,
        }}
      />

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
                <span className="cinema-hero__word-full">{renderWordPart(s.word)}</span>
              </div>
            );
          }
          const h = Math.ceil(s.word.length / 2);
          const left = s.word.slice(0, h);
          const right = s.word.slice(h);
          return (
            <div
              key={`${s.word}-${i}`}
              className={`cinema-hero__word ${i === slide ? "is-active" : ""}`}
            >
              <span className="cinema-hero__word-left">{renderWordPart(left)}</span>
              <span className="cinema-hero__word-gap" />
              <span className="cinema-hero__word-right">{renderWordPart(right)}</span>
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
        <div className="cinema-hero__cta-row">
          <button
            type="button"
            className="cinema-hero__menu-btn"
            onClick={() => {
              document.getElementById("menu")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {t("goToMenu")}
          </button>
          <Link href="/about" className="cinema-hero__more">
            {t("aboutCta")}
          </Link>
        </div>
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
      </div>
    </section>
  );
}
