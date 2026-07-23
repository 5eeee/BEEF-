const fs = require("fs");
const path = require("path");
const outDir = "c:/beefshteks (new)/scripts/scraped";

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
  return html.slice(start, next > 0 ? next : start + 100000);
}

function textsFrom(html) {
  const out = [];
  for (const m of html.matchAll(/<(h[1-6]|p|li|div)[^>]*>([\s\S]{0,1500}?)<\/\1>/gi)) {
    const t = strip(m[2]);
    if (
      t.length > 10 &&
      t.length < 700 &&
      !/tilda|cookie|Load more|jquery|function\(|{}/i.test(t) &&
      !/^https?:\/\//i.test(t)
    ) {
      out.push(t);
    }
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

const home = fs.readFileSync(path.join(outDir, "home.html"), "utf8");
const pages = [...home.matchAll(/href="(\/page[^"#]+)"/gi)].map((m) => m[1]);
console.log("pages", [...new Set(pages)]);

const menu = [];
for (const m of home.matchAll(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]{0,120}?)<\/a>/gi)) {
  const t = strip(m[2]);
  if (t && /PRO|нас|достав|контакт|Меню|Самовывоз/i.test(t)) menu.push({ href: m[1], text: t });
}
console.log("menu", menu);

// record types / ids near PRO
const recs = [...home.matchAll(/id="rec(\d+)"[^>]*data-record-type="(\d+)"/g)].map((m) => ({
  id: m[1],
  type: m[2],
}));
console.log("recs", recs);

const about = {
  source: "https://beefshteks.ru/",
  scrapedAt: new Date().toISOString(),
  brand: "BEEFштекс",
  slogan: "Бургеры с характером!",
  belief: "Мы верим в мясо",
  sections: [],
  contacts: {
    phone: "+7 (916) 035-67-77",
    hours: "Ежедневно с 10:00 до 22:00",
    address: "Коломна, ул. Октябрьской Революции, 362, ТРЦ Рио, фудкорт",
    pickup: "ул. Октябрьской Революции, 362, ТРЦ «Рио», третий этаж, фудкорт, #BEEFштекс",
  },
  delivery: {
    rule: "Курьером: до 2000 ₽ — 300 ₽, от 2000 ₽ — бесплатно",
    zones: [
      { name: "Центр (до Старого города)", price: "300 ₽" },
      { name: "Старый город", price: "300 ₽" },
      { name: "Колычево", price: "300 ₽" },
      { name: "Щурово", price: "300 ₽" },
    ],
  },
  social: [...new Set([...home.matchAll(/https:\/\/(?:t\.me|vk\.com|www\.instagram\.com|eda\.yandex\.ru)\/[^\s"'<>]+/g)].map((m) => m[0]))],
  images: [],
  pages: [],
};

// Extract meaningful blocks from cover + about-ish records
const interesting = ["637240500", "1857158271", "1034877696", "1857139151", "1127486541", "659583217", "1875455291"];
for (const id of interesting) {
  const chunk = extractRec(home, id);
  if (!chunk) continue;
  const texts = textsFrom(chunk);
  const imgs = imagesFrom(chunk);
  about.images.push(...imgs);
  if (texts.length) about.sections.push({ recId: id, texts: texts.slice(0, 20), images: imgs.slice(0, 8) });
}

// section titles across page
about.sectionTitles = [
  ...new Set(
    [...home.matchAll(/t-section__title[^>]*>([\s\S]{0,300}?)<\//gi)]
      .map((m) => strip(m[1]))
      .filter(Boolean)
  ),
];

const deliveryPath = path.join(outDir, "delivery.html");
const pagePath = path.join(outDir, "page115497056.html");
for (const p of [deliveryPath, pagePath]) {
  if (!fs.existsSync(p)) continue;
  const html = fs.readFileSync(p, "utf8");
  about.pages.push({
    file: path.basename(p),
    texts: textsFrom(html).slice(0, 50),
    images: imagesFrom(html).slice(0, 20),
  });
  about.images.push(...imagesFrom(html));
}

about.images = [...new Set(about.images)];

// Try to pull more descriptive prose near brand phrases
const phrases = ["Мы верим", "BEEFштекс", "Бургеры с характером", "Залетай к нам", "PRO"];
about.quotes = [];
for (const ph of phrases) {
  const i = home.indexOf(ph);
  if (i >= 0) about.quotes.push(strip(home.slice(i, i + 350)));
}

fs.writeFileSync(path.join(outDir, "about.json"), JSON.stringify(about, null, 2), "utf8");
console.log(JSON.stringify({ sections: about.sections.length, titles: about.sectionTitles, quotes: about.quotes, pageCount: about.pages.length, imgCount: about.images.length }, null, 2));
if (about.pages[0]) console.log("delivery texts", about.pages[0].texts.slice(0, 15));
for (const s of about.sections) console.log("REC", s.recId, s.texts.slice(0, 6));
