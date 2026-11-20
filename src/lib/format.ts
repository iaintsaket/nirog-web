import type { Offer } from "@/api/client";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 12345 paise → "₹123.45" */
export function rupees(paise: number): string {
  return inr.format(paise / 100);
}

const UNIT_NAMES: Record<Offer["pack_unit"], [string, string]> = {
  unit: ["tablet/capsule", "tablets/capsules"],
  ml: ["ml", "ml"],
  g: ["g", "g"],
};

/** "10 tablets/capsules", "100 ml" */
export function packLabel(count: number, unit: Offer["pack_unit"]): string {
  const [one, many] = UNIT_NAMES[unit];
  return `${count} ${count === 1 ? one : many}`;
}

/** Unit price in millipaise → "₹0.91 per tablet/capsule" */
export function unitPriceLabel(millipaise: number, unit: Offer["pack_unit"]): string {
  return `${rupees(millipaise / 1000)} per ${UNIT_NAMES[unit][0]}`;
}

/** Compact unit price for tight lists: "₹0.91 each", "₹0.50/ml". */
export function shortUnitPrice(millipaise: number, unit: Offer["pack_unit"]): string {
  return `${rupees(millipaise / 1000)}${unit === "unit" ? " each" : `/${unit}`}`;
}

/** 4525 basis points → "45%" (rounded down, never overstates). */
export function percent(bps: number): string {
  return `${Math.floor(bps / 100)}%`;
}

export function sourceLabel(source: Offer["source"]): string {
  return source === "jan_aushadhi" ? "Jan Aushadhi" : "Brand";
}

const FORMS: Record<string, string> = {
  tablet: "Tablet",
  capsule: "Capsule",
  liquid: "Syrup or liquid",
  injection: "Injection",
  topical: "Cream, gel or ointment",
  inhaler: "Inhaler",
  "eye-ear": "Eye or ear drops",
  other: "Other",
};

/** The form inside a match key ("form|release|salts|unit") → "Tablet", "Capsule, extended release". */
export function formLabel(matchKey: string): string | undefined {
  const [form, release] = matchKey.split("|");
  const name = form ? FORMS[form] : undefined;
  if (!name) return undefined;
  return release === "extended" ? `${name}, extended release` : name;
}
