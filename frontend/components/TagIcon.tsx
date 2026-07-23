type TagKind = "spicy" | "vegetarian" | "veg" | "new";

const SRC: Record<"spicy" | "veg" | "new", string> = {
  spicy: "/images/icons/fire.svg",
  veg: "/images/icons/leaf.svg",
  new: "/images/icons/stars.svg",
};

function resolveKind(kind: TagKind): keyof typeof SRC {
  if (kind === "vegetarian" || kind === "veg") return "veg";
  return kind;
}

/** Icon from /public/images/icons — tinted via CSS mask + currentColor */
export function TagIcon({ kind, className = "" }: { kind: TagKind; className?: string }) {
  const key = resolveKind(kind);
  return (
    <span className={`ye-tag-icon ye-tag-icon--${key} ${className}`.trim()} aria-hidden>
      <span
        className="ye-tag-glyph"
        style={{
          WebkitMaskImage: `url(${SRC[key]})`,
          maskImage: `url(${SRC[key]})`,
        }}
      />
    </span>
  );
}

/** Glyph only (for chips that already have their own background) */
export function TagGlyph({ kind }: { kind: TagKind }) {
  const key = resolveKind(kind);
  return (
    <span
      className="ye-tag-glyph"
      style={{
        WebkitMaskImage: `url(${SRC[key]})`,
        maskImage: `url(${SRC[key]})`,
      }}
      aria-hidden
    />
  );
}
