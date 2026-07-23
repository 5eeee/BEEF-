const fs = require("fs");
const path = "c:/beefshteks (new)/scripts/scraped/delivery.html";
if (!fs.existsSync(path)) {
  console.log("missing delivery.html");
  process.exit(1);
}
const h = fs.readFileSync(path, "utf8");
const strip = (t) =>
  t
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const blocks = [];
for (const m of h.matchAll(/<(h[1-6]|p|li|div)[^>]*>([\s\S]{0,500}?)<\/\1>/gi)) {
  const t = strip(m[2]);
  if (t.length > 12 && t.length < 220 && !/tilda|cookie|Load more/i.test(t)) blocks.push(t);
}
console.log([...new Set(blocks)].slice(0, 50).join("\n---\n"));
console.log("\nPHONES:", [...h.matchAll(/\+7[\d\s()\-]{10,20}/g)].map((m) => m[0]).slice(0, 8));
const i = h.indexOf("Коломна");
console.log("\nADDR:", i > 0 ? strip(h.slice(i, i + 180)) : "none");
