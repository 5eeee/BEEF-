import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import type { Product } from "@/lib/types";

const TAG_LABELS: Record<string, string> = {
  spicy: "Острое",
  vegetarian: "Вегги",
  new: "Новинка",
};

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  return (
    <Link href={`/product/${product.slug}`} className="card-frame group flex w-full flex-col overflow-hidden text-left">
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-stone-100">
        {product.image_url ? (
          <ProductImage
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-stone-100">
            <img
              src="/images/hero-burger.png"
              alt=""
              className="h-4/5 w-4/5 object-contain opacity-90"
            />
          </div>
        )}
        {product.tags.length > 0 && (
          <div className="absolute left-3 top-3 z-[1] flex flex-wrap gap-1">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink shadow-sm ring-1 ring-black/5"
              >
                {TAG_LABELS[tag] || tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <h3 className="font-display text-xl font-semibold leading-tight text-ink">{product.name}</h3>
        {product.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="text-xl font-semibold tabular-nums text-ink">
            {Number(product.price).toLocaleString("ru-RU")} ₽
          </span>
          <span className="photo-cta photo-cta--icon pointer-events-none">
            <img src="/images/ui/cta-burger-icon.png" alt="" className="photo-cta__img" draggable={false} />
            <span className="photo-cta__chip">Выбрать</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
