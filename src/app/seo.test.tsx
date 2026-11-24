import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { SearchFallback } from "@/features/search/Intro";
import { absolute, homeJsonLd, jsonLd } from "@/lib/site";
import manifest from "./manifest";
import robots from "./robots";
import sitemap from "./sitemap";

test("robots lets search engines index static pages, keeps crawlers off anything that calls the API, and bans AI and SEO-tool crawlers", () => {
  const r = robots();
  expect(r.sitemap).toBe("https://nirog.pages.dev/sitemap.xml");
  const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
  const everyone = rules.find((x) => x.userAgent === "*")!;
  expect(everyone.allow).toBe("/");
  // The API, live comparisons, search results and account pages all cost an API call or are per-visitor.
  expect(everyone.disallow).toEqual(["/v1/", "/compare", "/*?q=", "/saved", "/signin"]);
  const banned = rules.find((x) => x.userAgent !== "*")!;
  expect(banned.disallow).toBe("/");
  for (const bot of ["GPTBot", "CCBot", "ClaudeBot", "Google-Extended", "Bytespider", "AhrefsBot", "SemrushBot"]) {
    expect(banned.userAgent).toContain(bot);
  }
  for (const engine of ["Googlebot", "Bingbot", "DuckDuckBot"]) {
    expect(banned.userAgent).not.toContain(engine);
  }
});

test("sitemap lists home, the A–Z index and every medicine page, and nothing per-visitor", () => {
  const urls = sitemap().map((e) => e.url);
  expect(urls).toContain(absolute("/"));
  expect(urls).toContain(absolute("/medicines/p"));
  expect(urls).toContain(absolute("/medicine/paracetamol-650mg-tablet"));
  expect(urls.filter((u) => u.includes("/medicine/"))).toHaveLength(4);
  expect(urls.some((u) => /compare|saved|signin/.test(u))).toBe(false);
});

test("manifest names the app and offers its icons", () => {
  const m = manifest();
  expect(m.short_name).toBe("Nirog");
  expect(m.icons?.map((i) => i.src)).toEqual(["/icon.svg", "/apple-icon.png"]);
});

test("structured data describes the site search and cannot break out of its script tag", () => {
  const data = homeJsonLd() as { "@graph": { "@type": string; potentialAction?: { target: { urlTemplate: string } } }[] };
  expect(data["@graph"].map((n) => n["@type"])).toEqual(["WebSite", "Organization"]);
  expect(data["@graph"][0].potentialAction?.target.urlTemplate).toBe("https://nirog.pages.dev/?q={search_term_string}");
  expect(jsonLd({ name: "</script><script>x" })).not.toContain("<");
});

test("the pre-rendered home has the real heading and a search that works without JavaScript", () => {
  render(<SearchFallback />);
  expect(screen.getByRole("heading", { level: 1, name: "Pay less for the same medicine" })).toBeTruthy();
  const form = screen.getByRole("search") as HTMLFormElement;
  expect([form.getAttribute("action"), form.method]).toEqual(["/", "get"]);
  expect((screen.getByLabelText("Medicine name or salt") as HTMLInputElement).name).toBe("q");
});
