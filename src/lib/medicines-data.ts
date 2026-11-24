import { existsSync, readFileSync } from "node:fs";
import { letterOf, withSlugs, type MedicineData, type MedicineEntry } from "./medicines";

/**
 * Build-time only. The deploy fetches every page from the API into data/medicines.json
 * (scripts/fetch-medicines.mjs); without it, builds use a small real sample so CI and local
 * builds work offline. MEDICINES_REQUIRED=1 (set by the deploy) refuses to fall back.
 */
const LIVE = "data/medicines.json";
const SAMPLE = "e2e/fixtures/medicines.json";

let cached: { updatedOn: string | null; entries: MedicineEntry[]; bySlug: Map<string, MedicineEntry> } | undefined;

export function medicines() {
  if (cached) return cached;
  const file = process.env.MEDICINES_FILE || (existsSync(LIVE) ? LIVE : SAMPLE);
  if (process.env.MEDICINES_REQUIRED === "1" && file === SAMPLE) {
    throw new Error(`MEDICINES_REQUIRED: ${LIVE} is missing; run scripts/fetch-medicines.mjs first`);
  }
  const data = JSON.parse(readFileSync(file, "utf8")) as MedicineData;
  const entries = withSlugs(data.pages).sort((a, b) => a.slug.localeCompare(b.slug));
  cached = { updatedOn: data.updated_on, entries, bySlug: new Map(entries.map((e) => [e.slug, e])) };
  return cached;
}

/** The A–Z buckets that have at least one medicine, in order. */
export function letters(): string[] {
  return [...new Set(medicines().entries.map((e) => letterOf(e.slug)))].sort();
}
