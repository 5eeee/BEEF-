"use client";

import BrandFooter from "@/components/BrandFooter";
import CartDrawer from "@/components/CartDrawer";
import Header from "@/components/Header";
import MenuCatalog from "@/components/MenuCatalog";
import MenuHero from "@/components/MenuHero";
import MenuSpotlight from "@/components/MenuSpotlight";
import ProductModal from "@/components/ProductModal";
import { fetchActivePromos, fetchBlogPosts, fetchCategories, fetchProduct, fetchProducts } from "@/lib/api";
import type { BlogPost, Campaign, Category, Product } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

export default function MenuPageClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
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
    fetchActivePromos()
      .then(setCampaigns)
      .catch(() => setCampaigns([]));
    fetchBlogPosts(3)
      .then((data) => setBlogPosts(data.items || []))
      .catch(() => setBlogPosts([]));
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
          <MenuHero />
        </div>

        <main id="menu" className="menu-sheet">
          <div className="menu-sheet__handle" aria-hidden />
          <div className="menu-sheet__inner">
            <MenuSpotlight
              campaigns={campaigns}
              posts={blogPosts}
              categories={categories}
              onCategoryPick={handleCategoryChange}
            />

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
          </div>

          <BrandFooter withMap />
        </main>
      </div>

      <ProductModal product={selected} onClose={closeProduct} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
