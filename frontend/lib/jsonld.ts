import { SITE_URL } from "./site";
import type { Product } from "./types";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Beefshteks",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    telephone: "+74951234567",
    email: "hello@beefshteks.ru",
    sameAs: ["https://vk.com/beefshteks", "https://t.me/beefshteks"],
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#localbusiness`,
    name: "Beefshteks",
    url: SITE_URL,
    image: `${SITE_URL}/icon.svg`,
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
    telephone: "+74951234567",
    address: {
      "@type": "PostalAddress",
      streetAddress: "ул. Примерная, 1",
      addressLocality: "Москва",
      postalCode: "101000",
      addressCountry: "RU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 55.7558,
      longitude: 37.6173,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "10:00",
        closes: "23:00",
      },
    ],
    servesCuisine: "Burgers",
    priceRange: "₽₽",
    acceptsReservations: false,
  };
}

export function productJsonLd(product: Product) {
  const images =
    product.images?.map((img) => img.url) ?? (product.image_url ? [product.image_url] : []);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: images,
    url: `${SITE_URL}/product/${product.slug}`,
    sku: product.id,
    brand: { "@type": "Brand", name: "Beefshteks" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      price: product.price,
      priceCurrency: "RUB",
      availability: product.is_available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@id": `${SITE_URL}/#organization` },
    },
  };
}
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
