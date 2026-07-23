"use client";

type FloatItem = {
  src: string;
  x: string;
  y: string;
  w: number;
  opacity: number;
  depth: number;
  rotate?: number;
  blur?: number;
  delay?: string;
  z?: number;
  hideOnMobile?: boolean;
};

/** Even orbit — same bob period; delays spaced uniformly */
const FLOATS: FloatItem[] = [
  { src: "/images/float/leaf-2.png", x: "68%", y: "7%", w: 120, opacity: 0.88, depth: 0.7, rotate: 10, delay: "0s", z: 2 },
  { src: "/images/float/tomato-1.png", x: "56%", y: "11%", w: 80, opacity: 0.94, depth: 1.15, rotate: -14, delay: "0.55s", z: 3 },
  { src: "/images/float/cucumber-1.png", x: "82%", y: "11%", w: 72, opacity: 0.9, depth: 1.0, rotate: 8, delay: "1.1s", z: 2 },
  { src: "/images/float/onion-2.png", x: "94%", y: "20%", w: 86, opacity: 0.85, depth: 0.85, rotate: -10, delay: "1.65s", z: 2, hideOnMobile: true },
  { src: "/images/float/seed-1.png", x: "74%", y: "17%", w: 48, opacity: 0.7, depth: 1.3, rotate: 18, delay: "2.2s", z: 4, hideOnMobile: true },
  { src: "/images/float/stack-1.png", x: "76%", y: "28%", w: 136, opacity: 0.8, depth: 0.55, rotate: 3, delay: "2.75s", z: 1 },
  { src: "/images/float/tomato-2.png", x: "92%", y: "38%", w: 68, opacity: 0.92, depth: 1.2, rotate: 20, delay: "3.3s", z: 3 },
  { src: "/images/float/leaf-1.png", x: "98%", y: "48%", w: 110, opacity: 0.75, depth: 0.7, rotate: -16, delay: "3.85s", z: 1 },
  { src: "/images/float/cucumber-2.png", x: "86%", y: "52%", w: 88, opacity: 0.88, depth: 1.05, rotate: -6, delay: "4.4s", z: 2 },
  { src: "/images/float/onion-1.png", x: "72%", y: "46%", w: 72, opacity: 0.84, depth: 0.95, rotate: 26, delay: "4.95s", z: 2 },
  { src: "/images/float/tomato-3.png", x: "54%", y: "40%", w: 54, opacity: 0.76, depth: 1.25, rotate: -24, delay: "0.25s", z: 4 },
  { src: "/images/float/leaf-4.png", x: "64%", y: "32%", w: 92, opacity: 0.68, depth: 0.55, rotate: 18, delay: "0.8s", z: 1, blur: 0.4 },
  { src: "/images/float/leaf-3.png", x: "60%", y: "68%", w: 114, opacity: 0.82, depth: 0.8, rotate: -12, delay: "1.35s", z: 2 },
  { src: "/images/float/tomato-4.png", x: "70%", y: "78%", w: 70, opacity: 0.9, depth: 1.1, rotate: 14, delay: "1.9s", z: 3 },
  { src: "/images/float/cucumber-3.png", x: "88%", y: "74%", w: 66, opacity: 0.86, depth: 1.0, rotate: -18, delay: "2.45s", z: 2 },
  { src: "/images/float/onion-3.png", x: "96%", y: "66%", w: 64, opacity: 0.78, depth: 0.75, rotate: 8, delay: "3.0s", z: 2, hideOnMobile: true },
  { src: "/images/float/leaf-5.png", x: "80%", y: "86%", w: 100, opacity: 0.74, depth: 0.9, rotate: 5, delay: "3.55s", z: 1 },
  { src: "/images/float/stack-2.png", x: "54%", y: "84%", w: 92, opacity: 0.68, depth: 0.6, rotate: -8, delay: "4.1s", z: 1, hideOnMobile: true },
  { src: "/images/float/seed-2.png", x: "66%", y: "58%", w: 40, opacity: 0.65, depth: 1.35, rotate: -30, delay: "4.65s", z: 4, hideOnMobile: true },
  { src: "/images/float/leaf-6.png", x: "8%", y: "60%", w: 88, opacity: 0.16, depth: 0.3, rotate: -20, delay: "5.2s", z: 0, blur: 2.6, hideOnMobile: true },
];

type Props = {
  mouseX: number;
  mouseY: number;
  scroll: number;
  reduceMotion?: boolean;
};

export default function FloatingIngredients({ mouseX, mouseY, scroll, reduceMotion }: Props) {
  return (
    <div className="float-orbit" aria-hidden>
      {FLOATS.map((item, i) => {
        const px = mouseX * 36 * item.depth;
        const py = mouseY * 24 * item.depth + scroll * 70 * item.depth;
        const rotExtra = mouseX * 4 * item.depth;
        const hidden = item.hideOnMobile ? "hidden sm:block" : "";
        const fade = Math.max(0.25, 1 - scroll * 0.85);
        return (
          <div
            key={`${item.src}-${i}`}
            className={`float-sprite ${hidden} ${reduceMotion ? "float-sprite--static" : ""}`}
            style={{
              left: item.x,
              top: item.y,
              width: item.w,
              opacity: item.opacity * fade,
              zIndex: item.z ?? 1,
              filter: item.blur ? `blur(${item.blur}px)` : undefined,
              animationDelay: reduceMotion ? undefined : item.delay,
              transform: `translate3d(calc(-50% + ${px}px), calc(-50% + ${py}px), 0) rotate(${(item.rotate ?? 0) + rotExtra}deg)`,
            }}
          >
            <img src={item.src} alt="" draggable={false} />
          </div>
        );
      })}
    </div>
  );
}
