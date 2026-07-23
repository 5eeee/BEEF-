"use client";

import { useCallback, useEffect, useState } from "react";
import BlogPreview from "@/components/BlogPreview";
import CartDrawer from "@/components/CartDrawer";
import CinematicHero from "@/components/CinematicHero";
import Header from "@/components/Header";
import MenuCatalog from "@/components/MenuCatalog";
import ProductModal from "@/components/ProductModal";
import ReviewsSection from "@/components/ReviewsSection";
import SiteInfoSection from "@/components/SiteInfoSection";
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
      if (category) params.category = category;
      if (tags.length) params.tags = tags.join(",");
      const data = await fetchProducts(params);
      setProducts(data.items);
    } finally {
      setLoading(false);
    }
  }, [category, tags, sort]);

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
              onCategoryChange={setCategory}
              onTagToggle={toggleTag}
              onSortChange={setSort}
              onProductSelect={openProduct}
            />

            <div className="menu-sheet__footer">
              <SiteInfoSection />
              <ReviewsSection reviews={reviews} />
              <BlogPreview posts={blogPosts} />
            </div>
          </div>
        </main>
      </div>

      <ProductModal product={selected} onClose={closeProduct} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
