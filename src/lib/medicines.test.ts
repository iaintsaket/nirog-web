import { readFileSync } from "node:fs";
import { afterEach, expect, test, vi } from "vitest";
import type { MedicineData } from "./medicines";
import { asOf, description, heading, letterOf, compareHref, medicineJsonLd, slugFor, title, withSlugs } from "./medicines";

const sample = JSON.parse(readFileSync("e2e/fixtures/medicines.json", "utf8")) as MedicineData;
const paracetamol = sample.pages.find((p) => p.comparison.key === "tablet|standard|paracetamol:650mg|unit")!;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

test("slugs are readable, say the release and pack unit, and stay short", () => {
  expect(slugFor("tablet|standard|paracetamol:650mg|unit")).toBe("paracetamol-650mg-tablet");
  expect(slugFor("tablet|extended|aceclofenac:100mg+rabeprazole:20mg|unit")).toBe(
    "aceclofenac-100mg-rabeprazole-20mg-tablet-extended-release",
  );
  expect(slugFor("eye-ear|standard|moxifloxacin:0.5%|ml")).toBe("moxifloxacin-0-5-percent-eye-ear-ml");
  const long = slugFor(`tablet|standard|${Array.from({ length: 12 }, (_, i) => `salt${i}:10mg`).join("+")}|unit`);
  expect(long.length).toBeLessThanOrEqual(97);
  expect(long).toMatch(/-[0-9a-f]{6}$/);
});

test("keys that would share a slug each get a stable suffix; others keep the plain one", () => {
  const page = (key: string) => ({ ...paracetamol, comparison: { ...paracetamol.comparison, key } });
  const slugs = withSlugs([page("a|standard|x:1mg|unit"), page("a|standard|x 1mg|unit"), page("tablet|standard|y:2mg|unit")]).map((e) => e.slug);
  expect(slugs[0]).toMatch(/^x-1mg-a-[0-9a-f]{6}$/);
  expect(slugs[1]).toMatch(/^x-1mg-a-[0-9a-f]{6}$/);
  expect(slugs[0]).not.toBe(slugs[1]);
  expect(slugs[2]).toBe("y-2mg-tablet");
  expect(withSlugs(sample.pages).map((e) => e.slug)).toEqual(withSlugs(sample.pages).map((e) => e.slug));
});

test("page copy names the medicine, its options, the cheapest price and the date", () => {
  expect(heading(paracetamol)).toBe("Paracetamol 650mg tablet");
  expect(title(paracetamol)).toBe("Paracetamol 650mg tablet: 889 options from ₹0.31 each");
  const d = description(paracetamol, "2026-11-20");
  expect(d).toMatch(/^Same salts, strength and form: .+ and 88[6-8] more\. Cheapest is .+ at ₹0\.31 per tablet\/capsule, up to \d+% less\. Prices as of 20 Nov 2026\.$/);
  expect(asOf(null)).toBe("");
  expect(asOf("not a date")).toBe("");
  expect(compareHref("a|b")).toBe("/compare?key=a%7Cb");
  expect(compareHref("k1", "b1")).toBe("/compare?key=k1&searched=b1");
});

test("titles and descriptions fit a search result, shedding detail for long combination medicines instead of being cut off", () => {
  const offer = paracetamol.comparison.offers[0];
  const long = {
    ...paracetamol,
    names: paracetamol.names.map((n) => `${n} Extended Strength Combination Pack`),
    comparison: {
      ...paracetamol.comparison,
      offers: [{ ...offer, offer: { ...offer.offer, salts_label: "Acarbose 50mg + Metformin 500mg", name: "A Very Long Cheapest Brand Name 50mg/500mg/0.3mg Tablet SR" } }],
    },
  };
  for (const p of [...sample.pages, long]) {
    const t = title(p);
    expect(t.length + " · Nirog".length, t).toBeLessThanOrEqual(70);
    expect(description(p, "2026-11-20").length, description(p, "2026-11-20")).toBeLessThanOrEqual(170);
  }
  expect(title(long)).toBe("Acarbose 50mg + Metformin 500mg tablet: from ₹0.31 each");
  const huge = { ...long, comparison: { ...long.comparison, offers: [{ ...offer, offer: { ...offer.offer, salts_label: "Diclofenac Diethylamine 1.16% + Linseed Oil 3% + Menthol 5% + Methyl Salicylate 10%" } }] } };
  // Too long for any title: the name is shortened at a word, and the price that tells variants apart stays.
  expect(title(huge)).toBe("Diclofenac Diethylamine 1.16% + Linseed Oil…: from ₹0.31 each");
  expect(description(long, "2026-11-20")).toMatch(/^889 options with the same salts, strength and form\. Cheapest is A Very Long/);
});

test("A–Z buckets and structured data", () => {
  expect([letterOf("paracetamol-650mg-tablet"), letterOf("5-fluorouracil-cream")]).toEqual(["p", "0"]);
  const ld = medicineJsonLd({ slug: "paracetamol-650mg-tablet", page: paracetamol }) as { "@graph": Record<string, unknown>[] };
  const [drug, crumbs] = ld["@graph"];
  expect(drug).toMatchObject({ "@type": "Drug", name: "Paracetamol 650mg tablet", url: "https://nirog.pages.dev/medicine/paracetamol-650mg-tablet" });
  expect((drug.offers as { offerCount: number }).offerCount).toBe(889);
  expect((drug.alternateName as string[])).toContain("Dolo 650 Tablet");
  expect(crumbs["@type"]).toBe("BreadcrumbList");
});

test("the build uses fetched data when present, the sample otherwise, and the deploy refuses the sample", async () => {
  const { medicines, letters } = await import("./medicines-data");
  expect(medicines().entries.map((e) => e.slug)).toContain("paracetamol-650mg-tablet");
  expect(medicines().bySlug.get("paracetamol-650mg-tablet")?.page).toEqual(paracetamol);
  expect(letters()).toEqual(["a", "p"]);

  vi.resetModules();
  vi.stubEnv("MEDICINES_FILE", "");
  vi.stubEnv("MEDICINES_REQUIRED", "1");
  vi.doMock("node:fs", async (orig) => ({ ...(await orig<typeof import("node:fs")>()), existsSync: () => false }));
  const fresh = await import("./medicines-data");
  expect(() => fresh.medicines()).toThrow(/MEDICINES_REQUIRED/);
  vi.doUnmock("node:fs");
});
