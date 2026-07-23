import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import Header from "@/components/Header";
import ProductAddToCart from "@/components/ProductAddToCart";
import ProductImage from "@/components/ProductImage";
import { getAllProductSlugs, getProductBySlug } from "@/lib/catalog";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/jsonld";
import { getProductSeo } from "@/lib/seo";
import { REVALIDATE_SECONDS, SITE_URL } from "@/lib/site";

export const revalidate = REVALIDATE_SECONDS;

type Props = {
  params: { slug: string };
};

const CATEGORY_LABELS: Record<string, string> = {
  burgers: "Бургеры",
  starters: "Закуски",
  drinks: "Напитки",
  combos: "Комбо",
};

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    return { title: "Товар не найден — Beefshteks" };
  }

  const seo = getProductSeo(product);
  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: "website",
      locale: "ru_RU",
      images: product.image_url ? [{ url: product.image_url, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const categoryLabel = CATEGORY_LABELS[product.category_slug] || product.category_slug;
  const categoryUrl = `${SITE_URL}/menu/${product.category_slug}`;
  const productUrl = `${SITE_URL}/product/${product.slug}`;

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Главная", url: SITE_URL },
    { name: categoryLabel, url: categoryUrl },
    { name: product.name, url: productUrl },
  ]);

  const gallery =
    product.images && product.images.length > 0
      ? product.images
      : product.image_url
        ? [{ url: product.image_url, alt_text: product.name }]
        : [];

  return (
    <>
      <Script
        id="jsonld-product"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
      />
      <Script
        id="jsonld-breadcrumbs"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <Header />
      <main className="container-page py-6">
        <nav aria-label="Хлебные крошки" className="mb-6 text-sm text-muted">
          <Link href="/" className="hover:text-terracotta">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/menu/${product.category_slug}`} className="hover:text-terracotta">
            {categoryLabel}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <article className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            {gallery.length > 0 ? (
              <>
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-cream">
                  <ProductImage
                    src={gallery[0].url}
                    alt={gallery[0].alt_text || product.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                {gallery.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {gallery.slice(1).map((img) => (
                      <div
                        key={img.url}
                        className="relative aspect-square overflow-hidden rounded-xl bg-cream"
                      >
                        <ProductImage
                          src={img.url}
                          alt={img.alt_text || product.name}
                          fill
                          sizes="120px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-2xl bg-cream text-6xl">
                🍔
              </div>
            )}
          </div>

          <div className="space-y-6">
            <header>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>
              {product.description && (
                <p className="mt-3 text-lg text-muted">{product.description}</p>
              )}
            </header>

            {(product.weight_grams || product.calories) && (
              <p className="text-sm text-muted">
                {product.weight_grams && `${product.weight_grams} г`}
                {product.weight_grams && product.calories && " · "}
                {product.calories && `${product.calories} ккал`}
              </p>
            )}

            {product.ingredients && product.ingredients.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold">Состав</h2>
                <p className="mt-1 text-sm text-muted">
                  {product.ingredients.map((i) => i.name).join(", ")}
                </p>
              </section>
            )}

            {!product.is_available && (
              <p className="rounded-xl bg-stone-100 px-4 py-2 text-sm text-muted">
                Сейчас недоступно для заказа
              </p>
            )}

            <ProductAddToCart product={product} />
          </div>
        </article>
      </main>
    </>
  );
}
