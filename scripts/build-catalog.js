const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const root = "c:/beefshteks (new)";
const prodDir = path.join(root, "scripts/scraped/products");
const outDir = path.join(root, "frontend/public/images/products");
const brandDir = path.join(root, "frontend/public/images/brand");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(brandDir, { recursive: true });

const parts = [
  ["#BEEF Бургеры", "beef-burgers", "273230150151"],
  ["Смэш Бургеры", "smash-burgers", "374241014681"],
  ["Стартеры", "starters", "143993504411"],
  ["Завтрак", "breakfast", "167282033492"],
  ["Стрит Бокс", "street-box", "565917195392"],
  ["Комбо", "combos", "196341549311"],
  ["Салаты", "salads", "304616679251"],
  ["Напитки", "drinks", "737660085771"],
  ["Соусы", "sauces", "221454259401"],
];

const tr = {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"e","ж":"zh","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"h","ц":"ts","ч":"ch","ш":"sh","щ":"sch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya"," ":"-","#":""};
function slugify(s) {
  s = String(s).toLowerCase().split("").map(c => tr[c] ?? c).join("");
  return s.replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "item";
}
function stripHtml(t) {
  if (!t) return "";
  return String(t).replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}
function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) return resolve(dest);
    const file = fs.createWriteStream(dest);
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { headers: { "User-Agent": "Mozilla/5.0", Referer: "https://beefshteks.ru/" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        return reject(new Error("HTTP " + res.statusCode + " " + url));
      }
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve(dest)));
    });
    req.on("error", (e) => { try { fs.unlinkSync(dest); } catch {}; reject(e); });
  });
}

(async () => {
  const catalog = {
    source: "https://beefshteks.ru",
    logo_url: "https://static.tildacdn.com/tild6339-6464-4031-a361-363535646163/IMG_0004.PNG",
    categories: [],
    products: [],
  };
  const seen = new Set();
  for (let i = 0; i < parts.length; i++) {
    const [name, slug, uid] = parts[i];
    catalog.categories.push({ slug, name, sort_order: i + 1, image_url: null });
    const data = JSON.parse(fs.readFileSync(path.join(prodDir, uid + ".json"), "utf8"));
    for (const p of data.products || []) {
      const pid = String(p.uid);
      if (seen.has(pid)) continue;
      seen.add(pid);
      let gallery = p.gallery || "[]";
      if (typeof gallery === "string") { try { gallery = JSON.parse(gallery); } catch { gallery = []; } }
      let img = (gallery[0] && gallery[0].img) || (p.editions && p.editions[0] && p.editions[0].img) || null;
      const title = p.title || "";
      const desc = stripHtml(p.text || p.descr || "").split("\n")[0].slice(0, 280);
      const mark = String(p.mark || "").toLowerCase();
      const tags = [];
      if (mark.includes("нов")) tags.push("new");
      if (mark.includes("остр") || mark.includes("spicy")) tags.push("spicy");
      if (mark.includes("вег")) tags.push("vegetarian");
      let weight = p.portion;
      weight = weight === "" || weight == null ? null : parseInt(Number(weight), 10);
      if (Number.isNaN(weight)) weight = null;
      const pslug = slugify(title) + "-" + pid.slice(-6);
      const localName = pslug + ".jpg";
      catalog.products.push({
        slug: pslug,
        category_slug: slug,
        name: title,
        description: desc,
        price: Number(p.price || 0),
        weight_grams: weight,
        calories: null,
        popularity_score: Math.max(0, 200 - (p.sort || 0) % 200),
        tags,
        image_url: img,
        local_image: "/images/products/" + localName,
        local_file: localName,
        external_id: pid,
      });
    }
  }

  // download logo
  try {
    await download(catalog.logo_url, path.join(brandDir, "logo.png"));
    console.log("logo ok");
  } catch (e) { console.log("logo fail", e.message); }

  let ok = 0, fail = 0;
  for (const p of catalog.products) {
    if (!p.image_url) { fail++; continue; }
    try {
      await download(p.image_url, path.join(outDir, p.local_file));
      ok++;
      process.stdout.write(".");
    } catch (e) {
      fail++;
      console.log("\nfail", p.name, e.message);
    }
  }
  console.log("\ndownloaded", ok, "failed", fail, "total", catalog.products.length);

  // import payload uses local paths for frontend
  const importPayload = {
    replace_existing: true,
    categories: catalog.categories,
    products: catalog.products.map(p => ({
      slug: p.slug,
      category_slug: p.category_slug,
      name: p.name,
      description: p.description,
      price: p.price,
      weight_grams: p.weight_grams,
      calories: p.calories,
      popularity_score: p.popularity_score,
      tags: p.tags,
      ingredients: [],
      image_url: p.local_image, // will be served by next static; also keep remote as fallback later
    })),
  };
  fs.writeFileSync(path.join(root, "scripts/scraped/catalog.json"), JSON.stringify(catalog, null, 2), "utf8");
  fs.writeFileSync(path.join(root, "scripts/scraped/import-payload.json"), JSON.stringify(importPayload, null, 2), "utf8");
  console.log("wrote catalog.json and import-payload.json");
})();
