"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const SLIDES = [
  { word: "СОЧНЕЕ", tag: "Мраморная говядина · честные порции" },
  { word: "МОЩНЕЕ", tag: "Двойная котлета и характер в каждом укусе" },
  { word: "БОЛЬШЕ", tag: "Бургеры с характером" },
] as const;

const SOCIAL = [
  { href: "https://t.me/BEEFshteksDelivery", label: "Telegram", id: "tg", icon: "/images/social/telegram.svg" },
  { href: "https://vk.com/beefshtekskolomna", label: "VKontakte", id: "vk", icon: "/images/social/vk.svg" },
  { href: "https://www.instagram.com/beefshteks_burgers/", label: "Instagram", id: "ig", icon: "/images/social/instagram.svg" },
] as const;

function renderWordPart(text: string, allowLogo: boolean) {
  let usedLogo = !allowLogo;
  return text.split("").map((ch, i) => {
    if (!usedLogo && (ch === "О" || ch === "о")) {
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

export default function CinematicHero() {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [slide, setSlide] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [reduce, setReduce] = useState(false);
  const [scroll, setScroll] = useState(0);

  const next = useCallback(() => setSlide((s) => (s + 1) % SLIDES.length), []);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    if (mq.matches) return;

    let raf = 0;
    let target = { x: 0, y: 0 };

    const tick = () => {
      setMouse((prev) => {
        const nx = prev.x + (target.x - prev.x) * 0.07;
        const ny = prev.y + (target.y - prev.y) * 0.07;
        if (Math.abs(nx - prev.x) < 0.002 && Math.abs(ny - prev.y) < 0.002) return prev;
        return { x: nx, y: ny };
      });
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      target = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      };
    };

    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setScroll(Math.min(1, Math.max(0, -rect.top / Math.max(rect.height * 0.85, 1))));
    };

    raf = requestAnimationFrame(tick);
    onScroll();
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(next, AUTO_MS);
    return () => clearInterval(id);
  }, [next, reduce]);

  const mx = reduce ? 0 : mouse.x;
  const my = reduce ? 0 : mouse.y;
  const sc = reduce ? 0 : scroll;
  const textX = mx * -18 + sc * -24;
  const textY = my * -8 + sc * 18;
  const burgerX = mx * 22;
  const burgerY = my * 14 + sc * -12;
  const burgerRot = mx * 2.5;
  const burgerScale = ready ? 1 : 0.72;

  return (
    <section
      ref={ref}
      className={`cinema-hero ${ready ? "is-ready" : ""}`}
      aria-label="Главный экран"
    >
      <div className="cinema-hero__vignette" aria-hidden />
      <div className="cinema-hero__glow" aria-hidden />

      <div
        className="cinema-hero__type"
        style={{ transform: `translate3d(${textX}px, ${textY}px, 0)` }}
        aria-hidden
      >
        {SLIDES.map((s, i) => {
          const h = Math.ceil(s.word.length / 2);
          const left = s.word.slice(0, h);
          const right = s.word.slice(h);
          const logoInLeft = /[Оо]/.test(left);
          return (
            <div
              key={s.word}
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
        <p className="cinema-hero__tagline">{SLIDES[slide].tag}</p>
        <button
          type="button"
          className="cinema-hero__menu-btn"
          onClick={() => {
            document.getElementById("menu")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          Меню
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

        <Link href="/about#delivery" className="cinema-hero__more">
          Доставка <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
