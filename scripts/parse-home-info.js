const fs = require("fs");
const h = fs.readFileSync("c:/beefshteks (new)/scripts/scraped/home.html", "utf8");
const strip = (t) => t.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const find = (s) => {
  const i = h.indexOf(s);
  return i > 0 ? strip(h.slice(i, i + 400)) : null;
};
console.log("BELIEVE:", find("Мы верим"));
console.log("ZALETAI:", find("Залетай"));
console.log("HOURS:", find("10:00"));
console.log(
  "SOCIAL:",
  [...h.matchAll(/https:\/\/(?:t\.me|vk\.com|www\.instagram\.com|eda\.yandex\.ru)\/[^\s"'<>]+/g)].map((m) => m[0])
);
console.log("PHONE:", [...h.matchAll(/\+7[\d\s()\-]{10,22}/g)].map((m) => m[0]).slice(0, 5));
