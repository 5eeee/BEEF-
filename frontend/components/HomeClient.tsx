"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import BlogPreview from "@/components/BlogPreview";
import CartDrawer from "@/components/CartDrawer";
import CinematicHero from "@/components/CinematicHero";
import Header from "@/components/Header";
import MenuCatalog from "@/components/MenuCatalog";
import ProductModal from "@/components/ProductModal";
import ReviewsSection from "@/components/ReviewsSection";
import { fetchActivePromos, fetchBlogPosts, fetchCategories, fetchProduct, fetchProducts, fetchReviews } from "@/lib/api";
import type { BlogPost, Campaign, Category, Product, Review } from "@/lib/types";

export default function HomeClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [sort, setSort] = useState("popularity");
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { sort };
      if (tags.length) params.tags = tags.join(",");
      const data = await fetchProducts(params);
      setProducts(data.items);
    } finally {
      setLoading(false);
    }
  }, [tags, sort]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
    fetchActivePromos().then(setCampaigns).catch(() => {});
    fetchReviews(5)
      .then((data) => setReviews(data.items))
      .catch(() => {});
    fetchBlogPosts(2)
      .then((data) => setBlogPosts(data.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const menu = document.getElementById("menu");
    if (!menu) return;
    let raf = 0;
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = menu.getBoundingClientRect();
        const past = rect.bottom <= window.innerHeight * 0.35;
        document.documentElement.dataset.pastMenu = past ? "1" : "0";
      });
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      delete document.documentElement.dataset.pastMenu;
    };
  }, []);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const closeProduct = useCallback(() => setSelected(null), []);

  const openProduct = useCallback((product: Product) => {
    setSelected(product);
    fetchProduct(product.id)
      .then((detail) => {
        if (detail?.id) setSelected(detail);
      })
      .catch(() => {});
  }, []);

  const handleCategoryChange = useCallback((slug: string | null) => {
    setCategory(slug);
  }, []);

  const isDemo = process.env.NEXT_PUBLIC_DEMO === "1";

  return (
    <>
      <div className="site-shell is-visible">
        {isDemo ? (
          <div className="demo-banner" role="status">
            Демо для заказчика — меню и корзина работают в облаке. Полный заказ/оплата — на следующем этапе.
          </div>
        ) : null}
        <Header
          transparent
          theme="dark"
          variant="auto"
          onCartClick={() => setCartOpen(true)}
          onSearchSelect={openProduct}
        />

        <div className="home-first-screen" aria-hidden={false}>
          <CinematicHero />
        </div>

        <main id="menu" className="menu-sheet">
          <div className="menu-sheet__handle" aria-hidden />
          <div className="menu-sheet__inner">
            <MenuCatalog
              categories={categories}
              products={products}
              category={category}
              tags={tags}
              sort={sort}
              loading={loading}
              onCategoryChange={handleCategoryChange}
              onTagToggle={toggleTag}
              onSortChange={setSort}
              onProductSelect={openProduct}
            />

            <div className="menu-sheet__footer">
              <ReviewsSection reviews={reviews} />
              <BlogPreview posts={blogPosts} />
            </div>
          </div>

          <footer className="home-brand-footer" aria-label="Подвал">
            <div className="home-brand-footer__inner">
              <div className="home-brand-footer__brand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/brand/logo-mark.png" alt="" className="home-brand-footer__logo" />
                <div>
                  <p className="home-brand-footer__name">
                    BEEF<span>штекс</span>
                  </p>
                  <p className="home-brand-footer__tag">Бургеры с характером · Коломна</p>
                </div>
              </div>
              <nav className="home-brand-footer__nav" aria-label="Подвал">
                <Link href="/about">О нас</Link>
                <Link href="/contacts">Контакты</Link>
                <Link href="/blog">Блог</Link>
                <a href="tel:+79160356777">+7 (916) 035-67-77</a>
              </nav>
              <p className="home-brand-footer__addr">
                Коломна, ул. Октябрьской Революции, 362 · ТРЦ Рио, фудкорт
              </p>

              <div className="home-brand-footer__meta">
                <a
                  className="home-brand-footer__map-link"
                  href="https://yandex.ru/maps/org/beefshteks/24908451928/?ll=38.800483%2C55.084059&z=17"
                  target="_blank"
                  rel="noreferrer"
                >
                  Открыть BEEFштекс в Яндекс Картах
                </a>
                <p className="home-brand-footer__copy">© {new Date().getFullYear()} BEEFштекс</p>
              </div>
            </div>

            <div className="home-brand-footer__map-wrap">
              <iframe
                className="home-brand-footer__map"
                title="BEEFштекс — ТРЦ Рио, Коломна"
                src="https://yandex.ru/map-widget/v1/?ll=38.800483%2C55.084059&z=17&ol=biz&oid=24908451928"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </footer>
        </main>
      </div>

      <ProductModal product={selected} onClose={closeProduct} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
