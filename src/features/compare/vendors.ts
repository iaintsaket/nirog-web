import type { BuyLink, VendorStatus } from "@/api/client";

export type StockStatus = "in_stock" | "out_of_stock" | "unknown";

/** One row of the Where to buy section, whatever the API sent. */
export type VendorRow = {
  /** Stable id, e.g. "pharmeasy". */
  vendor: string;
  /** Display name, e.g. "PharmEasy". */
  label: string;
  url: string;
  /** "store": a store finder (Jan Aushadhi), not an online shop. */
  kind: BuyLink["kind"];
  status: StockStatus;
  pricePaise?: number;
  /** ISO time the vendor was last checked. */
  checkedAt?: string;
};

const NAMES: Record<string, string> = {
  "1mg": "Tata 1mg",
  pharmeasy: "PharmEasy",
  netmeds: "Netmeds",
  apollo: "Apollo Pharmacy",
};

const HOSTS: [RegExp, string][] = [
  [/(^|\.)1mg\.com$/, "1mg"],
  [/(^|\.)pharmeasy\.in$/, "pharmeasy"],
  [/(^|\.)netmeds\.com$/, "netmeds"],
  [/(^|\.)apollopharmacy\.in$/, "apollo"],
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** The vendor id for a link: known shops by host, anything else by its label. */
function vendorOf(link: BuyLink): string {
  let host = "";
  try {
    host = new URL(link.url).hostname;
  } catch {
    /* not a URL: fall back to the label */
  }
  return HOSTS.find(([re]) => re.test(host))?.[1] ?? slug(link.label);
}

/**
 * Rows for one offer. A shop the scraper checked (`vendors`) shows its stock, price and product
 * page in place of its search link; every other shop keeps its link, stock not checked.
 */
export function vendorRows(links: BuyLink[], vendors: VendorStatus[] = []): VendorRow[] {
  const checked: VendorRow[] = vendors.map((v) => ({
    vendor: v.vendor,
    label: NAMES[v.vendor] ?? v.vendor,
    url: v.url,
    kind: "online",
    status: v.status,
    pricePaise: v.price_paise ?? undefined,
    checkedAt: v.checked_at,
  }));
  const seen = new Set(checked.map((r) => r.vendor));
  const rest: VendorRow[] = links
    .map((l) => ({ vendor: vendorOf(l), label: l.label, url: l.url, kind: l.kind, status: "unknown" as const }))
    .filter((r) => !seen.has(r.vendor));
  return [...checked, ...rest];
}

const RANK: Record<StockStatus, number> = { in_stock: 0, unknown: 1, out_of_stock: 2 };
const price = (r: VendorRow) => r.pricePaise ?? Number.POSITIVE_INFINITY;

/** In stock first, then not checked, then out of stock; cheapest first within each; then by name. */
export function sortRows(rows: VendorRow[]): VendorRow[] {
  return [...rows].sort(
    (a, b) => RANK[a.status] - RANK[b.status] || price(a) - price(b) || a.label.localeCompare(b.label),
  );
}

/** The vendor to recommend: in stock, then cheapest, then by name. None unless one is known to be in stock. */
export function recommend(rows: VendorRow[]): VendorRow | undefined {
  const first = sortRows(rows)[0];
  return first?.status === "in_stock" ? first : undefined;
}

const DAY = 86_400_000;
const rtf = new Intl.RelativeTimeFormat("en-IN", { numeric: "auto" });

/** "checked 3 hours ago"; past 7 days it also says the data may be out of date. */
export function checkedLabel(checkedAt: string, now: number = Date.now()): string | undefined {
  const t = Date.parse(checkedAt);
  if (Number.isNaN(t)) return undefined;
  const ms = Math.max(0, now - t);
  const [n, unit]: [number, Intl.RelativeTimeFormatUnit] =
    ms < 3_600_000 ? [Math.floor(ms / 60_000), "minute"] : ms < DAY ? [Math.floor(ms / 3_600_000), "hour"] : [Math.floor(ms / DAY), "day"];
  const when = n === 0 && unit === "minute" ? "just now" : rtf.format(-n, unit);
  return `checked ${when}${ms > 7 * DAY ? " (may be out of date)" : ""}`;
}
