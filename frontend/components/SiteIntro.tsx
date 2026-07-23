"use client";

import { useEffect, useState } from "react";

type Props = {
  onDone: () => void;
};

export default function SiteIntro({ onDone }: Props) {
  const [phase, setPhase] = useState<"idle" | "grow" | "out">("idle");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onDone();
      return;
    }
    const t1 = window.setTimeout(() => setPhase("grow"), 280);
    const t2 = window.setTimeout(() => setPhase("out"), 2100);
    const t3 = window.setTimeout(() => onDone(), 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div
      className={`site-intro ${phase === "grow" ? "is-grow" : ""} ${phase === "out" ? "is-out" : ""}`}
      aria-hidden
    >
      <div className="site-intro__stack">
        <img src="/images/intro/bun-top.png" alt="" className="site-intro__bun site-intro__bun--top" />
        <p className="site-intro__brand">Beefshteks</p>
        <img src="/images/intro/bun-bottom.png" alt="" className="site-intro__bun site-intro__bun--bottom" />
      </div>
    </div>
  );
}
