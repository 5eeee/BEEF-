export type CategorySeo = {
  title: string;
  description: string;
  h1: string;
  intro: string;
  keywords: string[];
};

const CATEGORY_SEO: Record<string, CategorySeo> = {
  burgers: {
    title: "Бургеры с доставкой — заказать в Beefshteks",
    description:
      "Сочные бургеры на булочке бриошь с мраморной говядиной. Доставка за 45 минут по Москве. Классика, острые и вегетарианские позиции.",
    h1: "Бургеры с доставкой",
    intro:
      "Готовим бургеры из отборной говядины на тёплой булочке бриошь с фирменными соусами. Выберите классику, острый вариант или вегетарианский — привезём горячим за 45 минут.",
    keywords: ["бургеры", "доставка бургеров", "заказать бургер", "Beefshteks", "бургеры Москва"],
  },
  starters: {
    title: "Закуски к бургерам — картофель фри, наггетсы | Beefshteks",
    description:
      "Хрустящие закуски к бургерам: картофель фри, куриные наггетсы, луковые кольца. Быстрая доставка вместе с основным заказом.",
    h1: "Закуски к бургерам",
    intro:
      "Дополните бургер хрустящим картофелем фри, сочными наггетсами или луковыми кольцами. Идеальные закуски для компании — доставим вместе с основным заказом.",
    keywords: ["закуски", "картофель фри", "наггетсы", "закуски к бургерам", "доставка еды"],
  },
  drinks: {
    title: "Напитки — лимонады и морсы | Beefshteks",
    description:
      "Домашние лимонады, морсы и прохладительные напитки собственного приготовления. Освежающее дополнение к бургерам с доставкой.",
    h1: "Напитки к бургерам",
    intro:
      "Освежающие лимонады, ягодные морсы и классические напитки — готовим сами, без искусственных красителей. Идеально сочетаются с бургерами и закусками.",
    keywords: ["лимонады", "морсы", "напитки", "доставка напитков", "Beefshteks"],
  },
  combos: {
    title: "Комбо-наборы — бургер, закуска и напиток | Beefshteks",
    description:
      "Выгодные комбо: бургер, закуска и напиток в одной коробке. Экономьте на полноценном обеде с доставкой от Beefshteks.",
    h1: "Комбо-наборы",
    intro:
      "Соберите полноценный обед в одном заказе: сочный бургер, хрустящая закуска и освежающий напиток — выгоднее, чем заказывать по отдельности.",
    keywords: ["комбо", "наборы", "обед с доставкой", "комбо бургер", "Beefshteks"],
  },
};

export function getCategorySeo(slug: string, fallbackName?: string): CategorySeo {
  const seo = CATEGORY_SEO[slug];
  if (seo) return seo;

  const name = fallbackName || slug;
  return {
    title: `${name} — меню Beefshteks`,
    description: `Закажите ${name.toLowerCase()} с доставкой от Beefshteks. Быстро, вкусно, по-настоящему.`,
    h1: name,
    intro: `Выберите блюда из категории «${name}» и оформите доставку за 45 минут.`,
    keywords: [name, "Beefshteks", "доставка еды"],
  };
}

export function getProductSeo(product: { name: string; description?: string; category_slug: string }) {
  const categoryNames: Record<string, string> = {
    burgers: "бургеры",
    starters: "закуски",
    drinks: "напитки",
    combos: "комбо",
  };
  const catLabel = categoryNames[product.category_slug] || product.category_slug;

  return {
    title: `${product.name} — заказать с доставкой | Beefshteks`,
    description:
      product.description ||
      `Закажите «${product.name}» из раздела ${catLabel} с доставкой от Beefshteks за 45 минут.`,
  };
}

export const CATEGORY_SLUGS = Object.keys(CATEGORY_SEO);
