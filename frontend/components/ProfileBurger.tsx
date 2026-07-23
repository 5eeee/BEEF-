"use client";

import { useId } from "react";

export type BurgerSlide = {
  id: string;
  name: string;
  tagline: string;
  price: string;
  closed: string;
  open: string;
  backdrop: string;
  accent: string;
  ingredients: { id: string; label: string; side: "left" | "right"; y: number }[];
};

type Props = {
  burger: BurgerSlide;
  exploded: boolean;
};

/**
 * Photoreal morph: assembled food photo ↔ deconstructed food photo.
 * Same burger, same lighting — not CSS ingredient toys.
 */
export default function ProfileBurger({ burger, exploded }: Props) {
  const uid = useId();

  return (
    <div className={`morph-burger ${exploded ? "is-exploded" : ""}`}>
      <div className="morph-burger__frame">
        <img
          src={burger.closed}
          alt={burger.name}
          className="morph-burger__img morph-burger__img--closed"
          draggable={false}
        />
        <img
          src={burger.open}
          alt=""
          className="morph-burger__img morph-burger__img--open"
          draggable={false}
          aria-hidden
        />
      </div>

      <svg className="morph-burger__lines" viewBox="0 0 100 100" preserveAspectRatio="none">
        {burger.ingredients.map((ing) => {
          const x2 = ing.side === "left" ? 4 : 96;
          return (
            <g key={ing.id}>
              <line
                x1="52"
                y1={ing.y}
                x2={x2}
                y2={ing.y}
                stroke="currentColor"
                strokeWidth="0.5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx="52" cy={ing.y} r="1" fill="currentColor" />
              <circle cx={x2} cy={ing.y} r="0.65" fill="currentColor" />
            </g>
          );
        })}
      </svg>

      <ul className="morph-burger__labels">
        {burger.ingredients.map((ing, i) => (
          <li
            key={`${uid}-${ing.id}`}
            className={`morph-label morph-label--${ing.side}`}
            style={{
              top: `${ing.y}%`,
              transitionDelay: exploded ? `${180 + i * 50}ms` : "0ms",
            }}
          >
            {ing.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
