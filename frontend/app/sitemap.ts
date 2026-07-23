import type { MetadataRoute } from "next";
import { getAllProductSlugs, getCategories } from "@/lib/catalog";
import { CATEGORY_SLUGS } from "@/lib/seo";
import { REVALIDATE_SECONDS, SITE_URL } from "@/lib/site";

export const revalidate = REVALIDATE_SECONDS;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/menu`, lastModified: new Date(), changeFrequency: "daily", priority: 0.95 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/cart`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = CATEGORY_SLUGS.map((slug) => ({
    url: `${SITE_URL}/menu/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllProductSlugs();
    productPages = slugs.map((slug) => ({
      url: `${SITE_URL}/product/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    /* fallback slugs handled inside getAllProductSlugs */
  }

  // Include any extra categories from API not in static SEO list
  const categories = await getCategories();
  const extraCategoryPages: MetadataRoute.Sitemap = categories
    .filter((c) => !CATEGORY_SLUGS.includes(c.slug))
    .map((c) => ({
      url: `${SITE_URL}/menu/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...staticPages, ...categoryPages, ...extraCategoryPages, ...productPages];
}
