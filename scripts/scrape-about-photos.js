const https = require("https");
const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "frontend", "public", "images", "about");
fs.mkdirSync(outDir, { recursive: true });

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchText(res.headers.location).then(resolve, reject);
        }
        const chunks = [];
        res.on("data", (d) => chunks.push(d));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      })
      .on("error", reject);
  });
}

function fetchBin(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchBin(res.headers.location).then(resolve, reject);
        }
        const chunks = [];
        res.on("data", (d) => chunks.push(d));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

function imagesFrom(html) {
  const set = new Set();
  const re = /(?:data-original|data-img|src)=["'](https:\/\/static\.tildacdn\.com\/[^"']+\.(?:jpg|jpeg|png|webp))/gi;
  let m;
  while ((m = re.exec(html))) {
    const u = m[1].replace(/\\/g, "");
    if (!/tildacopy|favicon|empty|spacer/i.test(u)) set.add(u);
  }
  return [...set];
}

(async () => {
  const pages = ["https://beefshteks.ru/pro", "https://beefshteks.ru/probeef", "https://beefshteks.ru/"];
  const all = [];
  for (const p of pages) {
    const html = await fetchText(p);
    imagesFrom(html).forEach((u) => all.push(u));
  }
  const uniq = [...new Set(all)].slice(0, 14);
  console.log("found", uniq.length);
  uniq.forEach((u, i) => console.log(i, u));

  const saved = [];
  for (let i = 0; i < uniq.length; i++) {
    const u = uniq[i];
    const extMatch = u.match(/\.(jpe?g|png|webp)/i);
    const ext = (extMatch ? extMatch[1] : "jpg").toLowerCase().replace("jpeg", "jpg");
    const file = `photo-${i + 1}.${ext}`;
    try {
      const buf = await fetchBin(u);
      if (buf.length > 8000) {
        fs.writeFileSync(path.join(outDir, file), buf);
        saved.push(`/images/about/${file}`);
        console.log("saved", file, buf.length);
      }
    } catch (e) {
      console.warn("fail", u, e.message);
    }
  }

  const metaDir = path.join(__dirname, "scraped");
  fs.mkdirSync(metaDir, { recursive: true });
  fs.writeFileSync(path.join(metaDir, "about-images.json"), JSON.stringify({ saved, sources: uniq }, null, 2));
  console.log("done", saved.length);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
