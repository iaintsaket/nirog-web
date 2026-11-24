import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { expect, test } from "vitest";
import { checkSite } from "./seo-check.mjs";

const SITE = "https://nirog.pages.dev";
const DESC = "A description long enough to be a useful search snippet for this page.";

/** A built page with every tag the check wants; `drop` and `set` break one thing at a time. */
function page(path: string, o: { title?: string; desc?: string; canonical?: string | null; ogUrl?: string | null; h1s?: number; noindex?: boolean; ld?: string; img?: string } = {}) {
  const url = SITE + path;
  return `<!DOCTYPE html><html><head><title>${o.title ?? `Page ${path}`}</title>
<meta name="description" content="${o.desc ?? `${DESC} ${path}`}"/>
${o.noindex ? '<meta name="robots" content="noindex, nofollow"/>' : ""}
${o.canonical === null ? "" : `<link rel="canonical" href="${o.canonical ?? url}"/>`}
${o.ogUrl === null ? "" : `<meta property="og:url" content="${o.ogUrl ?? url}"/>`}
<script type="application/ld+json">${o.ld ?? "{}"}</script></head>
<body>${"<h1>Heading</h1>".repeat(o.h1s ?? 1)}${o.img ?? ""}</body></html>`;
}

function site(pages: Record<string, string>, sitemap: string[]) {
  const out = mkdtempSync(join(tmpdir(), "seo-"));
  for (const [file, html] of Object.entries(pages)) {
    mkdirSync(dirname(join(out, file)), { recursive: true });
    writeFileSync(join(out, file), html);
  }
  writeFileSync(join(out, "sitemap.xml"), `<urlset>${sitemap.map((p) => `<url><loc>${SITE}${p}</loc></url>`).join("")}</urlset>`);
  return out;
}

test("seo check passes a correct site and names each broken rule with the page it is on", () => {
  const good = site(
    { "index.html": page("/", { canonical: SITE, ogUrl: SITE }), "about.html": page("/about"), "saved.html": page("/saved", { noindex: true }), "404.html": "<html></html>" },
    ["/", "/about"],
  );
  expect(checkSite(good)).toEqual([]);

  const bad = site(
    {
      "index.html": page("/"),
      "a.html": page("/a", { canonical: null, h1s: 2 }),
      "b.html": page("/b", { title: "Page /a", desc: "Too short", ogUrl: SITE + "/" }),
      "c.html": page("/c", { ld: "{oops", img: '<img src="x.png">' }),
      "medicine/d.html": page("/medicine/d", { canonical: SITE + "/medicine/other" }),
      "saved.html": page("/saved", { noindex: true }),
    },
    ["/", "/a", "/b", "/c", "/saved", "/gone"],
  );
  expect(checkSite(bad)).toEqual([
    "/a: no canonical link",
    "/a: 2 <h1> headings, want exactly 1",
    "/b: description is 9 characters, want 50–170",
    "/b: og:url is https://nirog.pages.dev/, want https://nirog.pages.dev/b",
    "/c: JSON-LD does not parse",
    "/c: <img> without alt",
    "/medicine/d: canonical is https://nirog.pages.dev/medicine/other, want https://nirog.pages.dev/medicine/d",
    "/medicine/d: indexable but not in the sitemap",
    "/saved: noindex but listed in the sitemap",
    "title used on 2 pages: /a, /b",
    "sitemap lists /gone, which has no page",
  ]);
});
