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

/** 4525 basis points → "45%" (rounded down, never overstates). */
export function percent(bps: number): string {
  return `${Math.floor(bps / 100)}%`;
}

export function sourceLabel(source: Offer["source"]): string {
  return source === "jan_aushadhi" ? "Jan Aushadhi" : "Brand";
}
