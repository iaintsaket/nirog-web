import type { MedicinePage } from "@/api/client";
import { formLabel, percent, rupees, unitPriceLabel } from "./format";
import { absolute, TITLE_SUFFIX } from "./site";

/** What the website build reads: every medicine page, and when the prices were last imported. */
export type MedicineData = { updated_on: string | null; pages: MedicinePage[] };
export type MedicineEntry = { slug: string; page: MedicinePage };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** FNV-1a, so a clashing slug gets the same short suffix on every build. */
function shortHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  return h.toString(16).padStart(8, "0").slice(0, 6);
}

/** Longer slugs are cut at a word and given a stable suffix. */
const MAX_SLUG = 90;

/**
 * Readable, stable address for a match key ("form|release|salts|unit"), e.g.
 * "tablet|extended|aceclofenac:100mg+rabeprazole:20mg|unit" → "aceclofenac-100mg-rabeprazole-20mg-tablet-extended-release".
 * Packs sold by ml or g say so, since the same salts can also come per unit.
 */
export function slugFor(matchKey: string): string {
  const [form = "", release = "", salts = "", unit = ""] = matchKey.split("|");
  const parts = [salts.replace(/[:+]/g, " ").replace(/%/g, " percent"), form];
  if (release && release !== "standard") parts.push(`${release} release`);
  if (unit && unit !== "unit") parts.push(unit);
  const slug = slugify(parts.join(" "));
  if (!slug) return shortHash(matchKey);
  if (slug.length <= MAX_SLUG) return slug;
  return `${slug.slice(0, slug.lastIndexOf("-", MAX_SLUG))}-${shortHash(matchKey)}`;
}

/** Pages keyed by slug. Keys that would share a slug all get a stable suffix instead. */
export function withSlugs(pages: MedicinePage[]): MedicineEntry[] {
  const count = new Map<string, number>();
  for (const p of pages) {
    const s = slugFor(p.comparison.key);
    count.set(s, (count.get(s) ?? 0) + 1);
  }
  return pages.map((page) => {
    const s = slugFor(page.comparison.key);
    return { slug: count.get(s)! > 1 ? `${s}-${shortHash(page.comparison.key)}` : s, page };
  });
}

/** "Paracetamol 650mg tablet", "Acebrophylline 100mg capsule, extended release" */
export function heading(page: MedicinePage): string {
  const salts = page.comparison.offers[0]?.offer.salts_label ?? "";
  const form = formLabel(page.comparison.key);
  return form ? `${salts} ${form.charAt(0).toLowerCase()}${form.slice(1)}` : salts;
}

const cheapest = (page: MedicinePage) => page.comparison.offers[0]!.offer;

/** Room for a title before the layout's " · Nirog" suffix takes it past what a search result shows. */
const TITLE_ROOM = 70 - TITLE_SUFFIX.length;
/** Google cuts a snippet off at about this many characters. */
const DESCRIPTION_MAX = 170;

/** The first of `tries` that fits in `max`; the last one if none does. */
const firstFit = (tries: string[], max: number) => tries.find((t) => t.length <= max) ?? tries[tries.length - 1];

/**
 * Search-result title, e.g. "Paracetamol 650mg tablet: 889 options from ₹0.31 each". Long
 * combination medicines drop the count, then shorten the name at a word; the price stays, as it
 * is what tells apart variants whose names differ only near the end.
 */
export function title(page: MedicinePage): string {
  const c = cheapest(page);
  const from = `from ${rupees(c.unit_price_millipaise / 1000)}${c.pack_unit === "unit" ? " each" : `/${c.pack_unit}`}`;
  const h = heading(page);
  const short = `${cutAtWord(h, TITLE_ROOM - from.length - 2)}: ${from}`;
  return firstFit([`${h}: ${page.comparison.total_offers} options ${from}`, `${h}: ${from}`, short], TITLE_ROOM);
}

/** `s` in at most `max` characters, ending at a whole word with "…" when it had to be shortened. */
function cutAtWord(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).replace(/\s+\S*$/, "").replace(/[\s+,]+$/, "")}…`;
}

/** "13 Nov 2026" from "2026-11-13"; empty when unknown. */
export function asOf(updatedOn: string | null): string {
  if (!updatedOn) return "";
  const d = new Date(`${updatedOn}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function description(page: MedicinePage, updatedOn: string | null): string {
  const c = cheapest(page);
  const n = page.names.length;
  const save = page.comparison.saving_bps > 0 ? `, up to ${percent(page.comparison.saving_bps)} less` : "";
  const date = asOf(updatedOn);
  const cheapestIs = `Cheapest is ${c.name} at ${unitPriceLabel(c.unit_price_millipaise, c.pack_unit)}${save}.`;
  const asOfDate = date ? ` Prices as of ${date}.` : "";
  const named = (k: number) => {
    const more = page.comparison.total_offers - Math.min(n, k);
    return `Same salts, strength and form: ${page.names.slice(0, k).join(", ")}${more > 0 ? ` and ${more} more` : ""}. ${cheapestIs}`;
  };
  const counted = `${page.comparison.total_offers} options with the same salts, strength and form. ${cheapestIs}`;
  // Fewer brand names, then no date, before the snippet would be cut off; past that, end at a word.
  const best = firstFit([3, 2, 1].filter((k) => k <= n).map((k) => named(k) + asOfDate).concat(counted + asOfDate, counted), DESCRIPTION_MAX);
  return cutAtWord(best, DESCRIPTION_MAX);
}

/** A–Z index bucket for a slug: its first letter, or "0" for digits. */
export function letterOf(slug: string): string {
  const ch = slug.charAt(0);
  return ch >= "a" && ch <= "z" ? ch : "0";
}

export const letterLabel = (l: string) => (l === "0" ? "0–9" : l.toUpperCase());

export function medicineJsonLd({ slug, page }: MedicineEntry): object {
  const url = absolute(`/medicine/${slug}`);
  const letter = letterOf(slug);
  const prices = page.comparison.offers.map((o) => o.offer.price_paise / 100);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Drug",
        "@id": `${url}#drug`,
        name: heading(page),
        url,
        activeIngredient: page.comparison.offers[0]?.offer.salts_label,
        dosageForm: formLabel(page.comparison.key),
        alternateName: page.names,
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "INR",
          lowPrice: Math.min(...prices).toFixed(2),
          offerCount: page.comparison.total_offers,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Nirog", item: absolute("/") },
          { "@type": "ListItem", position: 2, name: `Medicines: ${letterLabel(letter)}`, item: absolute(`/medicines/${letter}`) },
          { "@type": "ListItem", position: 3, name: heading(page), item: url },
        ],
      },
    ],
  };
}

/** The live comparison page for a key; `searched` marks the offer the visitor searched for. */
export function compareHref(key: string, searched?: string): string {
  const p = new URLSearchParams({ key });
  if (searched) p.set("searched", searched);
  return `/compare?${p}`;
}
