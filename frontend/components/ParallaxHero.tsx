"use client";

import { useEffect, useRef, useState } from "react";
import PhotoCta from "@/components/PhotoCta";

type Props = {
  onOrderClick?: () => void;
};

/**
 * 3-layer parallax:
 * 1) rustic wall — slowest
 * 2) copy — between layers, reverse scroll
 * 3) PNG table+burger — nearly static (+ soft mouse)
 */
export default function ParallaxHero({ onOrderClick }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [scroll, setScroll] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReady(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    if (mq.matches) return;

    let raf = 0;
    let targetMouse = { x: 0, y: 0 };

    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)));
      setScroll(p);
    };

    const tick = () => {
      setMouse((prev) => {
        const nx = prev.x + (targetMouse.x - prev.x) * 0.08;
        const ny = prev.y + (targetMouse.y - prev.y) * 0.08;
        if (Math.abs(nx - prev.x) < 0.001 && Math.abs(ny - prev.y) < 0.001) {
          return prev;
        }
        return { x: nx, y: ny };
      });
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      targetMouse = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      };
    };

    onScroll();
    raf = requestAnimationFrame(tick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  const mx = reduce ? 0 : mouse.x;
  const my = reduce ? 0 : mouse.y;
  const sc = reduce ? 0 : scroll;

  // Layer speeds
  const wallY = sc * 28 + my * -6;
  const wallX = mx * -10;
  const textY = sc * -42 + my * 4; // opposite to scroll
  const textX = mx * 8;
  const tableY = my * 3; // nearly static
  const tableX = mx * 14;

  return (
    <section ref={ref} className={`scene-hero ${ready ? "is-ready" : ""}`} aria-label="Главный экран">
      {/* 1 — wall (slowest) */}
      <div
        className="scene-hero__wall"
        style={{
          transform: ready
            ? `translate3d(${wallX}px, ${wallY}px, 0) scale(1.12)`
            : undefined,
        }}
      >
        <img src="/images/parallax/wall.png" alt="" draggable={false} />
        <div className="scene-hero__wall-wash" />
      </div>

      {/* 2 — text (between wall and table, reverse scroll) */}
      <div
        className="scene-hero__copy"
        style={{
          transform: ready ? `translate3d(${textX}px, ${textY}px, 0)` : undefined,
        }}
      >
        <div className="scene-hero__copy-inner">
          <p className="scene-hero__eyebrow">Доставка · 45 минут</p>
          <h1 className="scene-hero__title">
            <span className="scene-hero__brand">Beefshteks</span>
            <span className="scene-hero__line">
              СОЧНО <span className="scene-hero__amp">&</span> ГОРЯЧО
            </span>
            <span className="scene-hero__line scene-hero__line--sub">С ЛЮБОВЬЮ</span>
          </h1>
          <p className="scene-hero__lead">
            Сочная мраморная говядина, честные порции и доставка, которой можно доверять.
          </p>
          <div className="scene-hero__actions">
            <PhotoCta href="#menu" label="Смотреть меню" onClick={onOrderClick} variant="dark" className="photo-cta--lg" />
            <a href="tel:+74951234567" className="hero-phone-btn">
              +7 (495) 123-45-67
            </a>
          </div>
        </div>
      </div>

      {/* 3 — table + burger (static / light mouse) */}
      <div
        className="scene-hero__table"
        style={{
          transform: ready ? `translate3d(${tableX}px, ${tableY}px, 0)` : undefined,
        }}
      >
        <img src="/images/parallax/table.png" alt="Бургер и картофель на столе" draggable={false} />
      </div>

      {/* Smooth blend into light menu */}
      <div className="scene-hero__fade" aria-hidden />
    </section>
  );
}
