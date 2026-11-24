// After `next build`: read every page in the static export and fail on SEO mistakes a reviewer
// would otherwise have to spot by eye. New routes are covered without listing them, because the
// check reads what the build wrote. Run: node scripts/seo-check.mjs [out]
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

const TITLE_MAX = 70; // Google cuts titles off at about 60–70 characters.
const DESC = [50, 170]; // Shorter says little; longer is cut off in the snippet.
/** Error pages that Next writes into the export; they are never indexed. */
const SKIP = new Set(["404.html", "_not-found.html"]);

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");

/** Attributes of every tag named `tag`, as plain objects. */
function tags(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, "gi"))].map(([, attrs]) =>
    Object.fromEntries([...attrs.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)].map(([, k, v]) => [k.toLowerCase(), decode(v)])),
  );
}

const meta = (html, key, name) => tags(html, "meta").find((m) => m[key] === name)?.content;

function htmlFiles(dir, root = dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "_next" ? [] : htmlFiles(p, root);
    return name.endsWith(".html") && !SKIP.has(name) ? [relative(root, p)] : [];
  });
}

/** out/index.html → "/", out/about.html → "/about", out/a/index.html → "/a". */
function routeOf(file) {
  const parts = file.split(sep).join("/").replace(/\.html$/, "").replace(/(^|\/)index$/, "");
  return `/${parts}`;
}

/** Every problem in the export at `out`, one line each; empty means it passes. */
export function checkSite(out) {
  const locs = [...readFileSync(join(out, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, u]) => decode(u));
  const origin = locs.length ? new URL(locs[0]).origin : "";
  const inSitemap = new Set(locs.map((u) => new URL(u).pathname));
  const problems = [];
  const titles = new Map();
  const descriptions = new Map();
  const routes = new Set();

  const pages = htmlFiles(out)
    .map((file) => ({ route: routeOf(file), html: readFileSync(join(out, file), "utf8") }))
    .sort((a, b) => a.route.localeCompare(b.route));

  for (const { route, html } of pages) {
    routes.add(route);
    const say = (msg) => problems.push(`${route}: ${msg}`);
    if (/noindex/i.test(meta(html, "name", "robots") ?? "")) {
      if (inSitemap.has(route)) say("noindex but listed in the sitemap");
      continue;
    }
    const want = origin + route;
    const title = decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "").trim();
    const desc = meta(html, "name", "description") ?? "";
    const canonical = tags(html, "link").find((l) => l.rel === "canonical")?.href;
    const ogUrl = meta(html, "property", "og:url");
    const h1s = (html.match(/<h1\b/gi) ?? []).length;

    if (!title) say("no <title>");
    else if (title.length > TITLE_MAX) say(`title is ${title.length} characters, want at most ${TITLE_MAX}`);
    // URL() makes "https://site" and "https://site/" the same, as Next writes the home canonical without the slash.
    const same = (u) => { try { return new URL(u).href === new URL(want).href; } catch { return false; } };
    if (!canonical) say("no canonical link");
    else if (!same(canonical)) say(`canonical is ${canonical}, want ${want}`);
    if (h1s !== 1) say(`${h1s} <h1> headings, want exactly 1`);
    if (!desc) say("no meta description");
    else if (desc.length < DESC[0] || desc.length > DESC[1]) say(`description is ${desc.length} characters, want ${DESC[0]}–${DESC[1]}`);
    if (!ogUrl) say("no og:url, so a shared link previews as the home page");
    else if (!same(ogUrl)) say(`og:url is ${ogUrl}, want ${want}`);
    for (const [, body] of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        JSON.parse(body);
      } catch {
        say("JSON-LD does not parse");
      }
    }
    if (tags(html, "img").some((img) => !("alt" in img))) say("<img> without alt");
    if (!inSitemap.has(route)) say("indexable but not in the sitemap");

    if (title) titles.set(title, [...(titles.get(title) ?? []), route]);
    if (desc) descriptions.set(desc, [...(descriptions.get(desc) ?? []), route]);
  }

  for (const [what, seen] of [["title", titles], ["description", descriptions]]) {
    for (const where of seen.values()) if (where.length > 1) problems.push(`${what} used on ${where.length} pages: ${where.join(", ")}`);
  }
  for (const path of inSitemap) if (!routes.has(path)) problems.push(`sitemap lists ${path}, which has no page`);
  return problems;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const out = process.argv[2] ?? "out";
  const problems = checkSite(out);
  for (const p of problems) console.error(`seo: ${p}`);
  console.log(`seo check: ${problems.length} problem(s) in ${out}`);
  if (problems.length) process.exit(1);
}
