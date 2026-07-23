import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

/** Optimized lazy image with WebP/srcset via next/image. */
export default function ProductImage({
  src,
  alt,
  fill,
  width,
  height,
  priority = false,
  className = "object-cover",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: Props) {
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        loading={priority ? undefined : "lazy"}
        priority={priority}
        className={className}
        sizes={sizes}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 800}
      height={height ?? 600}
      loading={priority ? undefined : "lazy"}
      priority={priority}
      className={className}
      sizes={sizes}
    />
  );
}
