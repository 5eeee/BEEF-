const fs = require("fs");
const https = require("https");
const path = require("path");

const outDir = "c:/beefshteks (new)/scripts/scraped";
fs.mkdirSync(outDir, { recursive: true });

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetch(res.headers.location).then(resolve, reject);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      })
      .on("error", reject);
  });
}

function strip(t) {
  return String(t || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractRec(html, recId) {
  const start = html.indexOf(`id="rec${recId}"`);
  if (start < 0) return null;
  const next = html.indexOf('id="rec', start + 10);
  const chunk = html.slice(start, next > 0 ? next : start + 80000);
  return chunk;
}

function textsFrom(html) {
  const out = [];
  for (const m of html.matchAll(
    /<(h[1-6]|p|li|div)[^>]*(?:class="[^"]*(?:title|descr|text|heading|name|subtitle)[^"]*"|itemprop)[^>]*>([\s\S]{0,1200}?)<\/\1>/gi
  )) {
    const t = strip(m[2]);
    if (t.length > 8 && t.length < 600 && !/tilda|cookie|Load more|OK$/i.test(t)) out.push(t);
  }
  // also plain titles
  for (const m of html.matchAll(/<(h[1-6])[^>]*>([\s\S]{0,400}?)<\/\1>/gi)) {
    const t = strip(m[2]);
    if (t.length > 3 && t.length < 200) out.push(t);
  }
  return [...new Set(out)];
}

function imagesFrom(html) {
  const imgs = [];
  for (const m of html.matchAll(
    /(?:data-original|data-img|src|content)=["'](https:\/\/static\.tildacdn\.com\/[^"']+\.(?:jpg|jpeg|png|webp))/gi
  )) {
    imgs.push(m[1].replace(/\\/g, ""));
  }
  return [...new Set(imgs)];
}

(async () => {
  const home = await fetch("https://beefshteks.ru/");
  fs.writeFileSync(path.join(outDir, "home.html"), home, "utf8");

  // nav links mentioning pages
  const pageHrefs = [
    ...home.matchAll(/href="(\/page[^"#]+|https:\/\/beefshteks\.ru\/page[^"#]+)"/gi),
  ].map((m) => m[1].replace("https://beefshteks.ru", ""));
  const uniquePages = [...new Set(pageHrefs)];
  console.log("pages", uniquePages);

  // Menu items with text
  const menuItems = [];
  for (const m of home.matchAll(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]{0,120}?)<\/a>/gi)) {
    const t = strip(m[2]);
    if (/PRO|нас|достав|контакт|меню|самовывоз/i.test(t) || /page\d+|rec\d+/i.test(m[1])) {
      menuItems.push({ href: m[1], text: t });
    }
  }
  console.log("menu", menuItems.slice(0, 30));

  // Known about-ish records from earlier scrape: 1034877696 contacts/footer area, cover, etc.
  const aboutRecIds = [
    "637240500", // cover
    "1857158271", // CTAs
    "1034877696", // contacts / about from nav
    "1857139151",
    "1127486541",
    "659583217",
  ];

  const about = {
    source: "https://beefshteks.ru/",
    scrapedAt: new Date().toISOString(),
    headline: null,
    tagline: null,
    sections: [],
    contacts: {},
    social: [],
    images: [],
    pages: [],
  };

  // Cover / hero brand text
  const cover = extractRec(home, "637240500") || home;
  const coverTexts = textsFrom(cover);
  about.headline = coverTexts.find((t) => /BEEF|штекс/i.test(t)) || "#BEEFштекс";
  about.tagline =
    coverTexts.find((t) => /характер|верим|мясо|бургер/i.test(t)) || "Бургеры с характером!";

  for (const id of aboutRecIds) {
    const chunk = extractRec(home, id);
    if (!chunk) continue;
    const texts = textsFrom(chunk);
    const imgs = imagesFrom(chunk);
    about.images.push(...imgs);
    if (texts.length) {
      about.sections.push({
        recId: id,
        title: texts[0],
        paragraphs: texts.slice(1),
      });
    }
  }

  // Footer / zaletai block
  const footIdx = home.indexOf("Залетай");
  if (footIdx > 0) {
    const foot = strip(home.slice(footIdx, footIdx + 500));
    about.sections.push({ recId: "footer", title: "Контакты", paragraphs: [foot] });
  }

  about.social = [
    ...home.matchAll(/https:\/\/(?:t\.me|vk\.com|www\.instagram\.com|eda\.yandex\.ru)\/[^\s"'<>]+/g),
  ].map((m) => m[0]);
  about.social = [...new Set(about.social)];

  const phones = [...home.matchAll(/\+7[\d\s()\-]{10,22}/g)].map((m) => m[0]);
  about.contacts.phone = phones[0] || "+7 (916) 035-67-77";
  about.contacts.hours = "Ежедневно с 10:00 до 22:00";
  about.contacts.address = "Коломна, ул. Октябрьской Революции, 362, ТРЦ Рио, фудкорт";

  // Fetch extra pages
  for (const p of uniquePages) {
    const url = p.startsWith("http") ? p : `https://beefshteks.ru${p}`;
    try {
      const html = await fetch(url);
      const slug = p.replace(/^\//, "").replace(/\.html.*/, "") || "page";
      fs.writeFileSync(path.join(outDir, `${slug}.html`), html, "utf8");
      const texts = textsFrom(html);
      const imgs = imagesFrom(html);
      about.pages.push({
        url,
        slug,
        texts: texts.slice(0, 40),
        images: imgs.slice(0, 20),
      });
      about.images.push(...imgs);
      console.log("fetched", url, "texts", texts.length);
    } catch (e) {
      console.log("fail", url, e.message);
    }
  }

  about.images = [...new Set(about.images)].slice(0, 40);

  // Also try common about page guesses / sitemap from allrecords titles
  const titles = [...home.matchAll(/t-section__title[^>]*>([\s\S]{0,200}?)<\//gi)].map((m) =>
    strip(m[1])
  );
  about.sectionTitles = [...new Set(titles)];

  fs.writeFileSync(path.join(outDir, "about.json"), JSON.stringify(about, null, 2), "utf8");
  console.log("wrote about.json sections", about.sections.length, "pages", about.pages.length);
  console.log("titles", about.sectionTitles);
  console.log(
    "page texts sample",
    about.pages.map((p) => ({ url: p.url, sample: p.texts.slice(0, 8) }))
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
