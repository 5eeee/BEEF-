import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { getCategory, getProducts } from "@/lib/catalog";
import { CATEGORY_SLUGS, getCategorySeo } from "@/lib/seo";
import { REVALIDATE_SECONDS } from "@/lib/site";

export const revalidate = REVALIDATE_SECONDS;

type Props = {
  params: { category: string };
};

export async function generateStaticParams() {
  return CATEGORY_SLUGS.map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory(params.category);
  const seo = getCategorySeo(params.category, category?.name);

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: "website",
      locale: "ru_RU",
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const category = await getCategory(params.category);
  if (!category) notFound();

  const { items: products } = await getProducts({ category: params.category });
  const seo = getCategorySeo(params.category, category.name);

  return (
    <>
      <Header />
      <main className="container-page space-y-8 py-6">
        <nav aria-label="Хлебные крошки" className="text-sm text-muted">
          <Link href="/" className="hover:text-terracotta">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{category.name}</span>
        </nav>

        <section className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{seo.h1}</h1>
          <p className="max-w-2xl text-lg text-muted">{seo.intro}</p>
          {category.description && (
            <p className="max-w-2xl text-muted">{category.description}</p>
          )}
        </section>

        <section>
          {products.length === 0 ? (
            <p className="py-12 text-center text-muted">В этой категории пока нет блюд.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-cream p-6">
          <h2 className="text-lg font-semibold">Другие категории</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORY_SLUGS.filter((slug) => slug !== params.category).map((slug) => {
              const labels: Record<string, string> = {
                burgers: "Бургеры",
                starters: "Закуски",
                drinks: "Напитки",
                combos: "Комбо",
              };
              return (
                <Link
                  key={slug}
                  href={`/menu/${slug}`}
                  className="rounded-full bg-white px-4 py-2 text-sm font-medium text-ink ring-1 ring-stone-100 hover:bg-terracotta hover:text-white"
                >
                  {labels[slug] || slug}
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
