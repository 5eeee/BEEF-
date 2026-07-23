"use client";

import { useEffect, useRef, useState } from "react";

export default function MenuHero() {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    let raf = 0;
    let target = { x: 0, y: 0 };

    const tick = () => {
      setTilt((prev) => {
        const nx = prev.x + (target.x - prev.x) * 0.06;
        const ny = prev.y + (target.y - prev.y) * 0.06;
        if (Math.abs(nx - prev.x) < 0.001 && Math.abs(ny - prev.y) < 0.001) return prev;
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

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      ref={ref}
      className={`menu-hero ${ready ? "is-ready" : ""}`}
      aria-label="Меню BEEFштекс"
    >
      <div className="menu-hero__bg" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/about/plated-signature-burger.png"
          alt=""
          className="menu-hero__photo"
          style={{
            transform: `translate3d(${tilt.x * -12}px, ${tilt.y * -10}px, 0) scale(1.08)`,
          }}
          draggable={false}
        />
        <div className="menu-hero__shade" />
        <div className="menu-hero__glow" />
      </div>

      <div
        className="menu-hero__copy"
        style={{ transform: `translate3d(${tilt.x * 8}px, ${tilt.y * 6}px, 0)` }}
      >
        <p className="menu-hero__eyebrow">Меню · Коломна</p>
        <h1 className="menu-hero__brand">
          BEEF<span>штекс</span>
        </h1>
        <p className="menu-hero__lead">Акции, новости корнера и полное меню — одним скроллом ниже.</p>
        <div className="menu-hero__actions">
          <button type="button" className="menu-hero__btn menu-hero__btn--accent" onClick={() => scrollTo("menu")}>
            К новостям
          </button>
          <button type="button" className="menu-hero__btn" onClick={() => scrollTo("menu-grid")}>
            Сразу к меню
          </button>
        </div>
      </div>

      <button
        type="button"
        className="menu-hero__scroll"
        onClick={() => scrollTo("menu")}
        aria-label="Листать вниз"
      >
        <span />
      </button>
    </section>
  );
}
