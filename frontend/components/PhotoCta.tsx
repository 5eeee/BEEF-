type Props = {
  href: string;
  label: string;
  onClick?: () => void;
  variant?: "dark" | "light" | "icon";
  className?: string;
};

export default function PhotoCta({ href, label, onClick, variant = "dark", className = "" }: Props) {
  const isDark = variant === "dark";

  if (variant === "icon") {
    return (
      <a
        href={href}
        onClick={onClick}
        className={`photo-cta photo-cta--icon photo-cta--css ${className}`}
        aria-label={label}
      >
        <span className="photo-cta__css-bg photo-cta__css-bg--icon" aria-hidden />
        <span className="photo-cta__chip">{label}</span>
      </a>
    );
  }

  return (
    <a
      href={href}
      onClick={onClick}
      className={`photo-cta photo-cta--${variant} photo-cta--css ${className}`}
    >
      <span
        className={`photo-cta__css-bg ${isDark ? "photo-cta__css-bg--dark" : "photo-cta__css-bg--light"}`}
        aria-hidden
      />
      <span className="photo-cta__scrim" aria-hidden />
      <span className="photo-cta__label">{label}</span>
    </a>
  );
}
