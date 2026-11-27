import { expect, test } from "vitest";
import { checkedLabel, recommend, sortRows, vendorLabel, vendorRows, type VendorRow } from "./vendors";

const row = (over: Partial<VendorRow>): VendorRow => ({
  vendor: "x",
  label: "X",
  kind: "online",
  status: "unknown",
  ...over,
});

test("rows: checked pharmacies under generic names without links, then store finders; online links dropped", () => {
  const links = [
    { kind: "online" as const, label: "Some Shop", url: "https://shop.example/search?q=dolo" },
    { kind: "store" as const, label: "Find a Jan Aushadhi Kendra", url: "https://example.org/kendra" },
  ];
  expect(
    vendorRows(links, [
      { vendor: "source_a", display_name: "Pharmacy a", status: "in_stock", price_paise: 3000, checked_at: "2026-11-25T00:00:00Z" },
      { vendor: "source_b", display_name: "Pharmacy b", status: "out_of_stock", price_paise: null, checked_at: "2026-11-24T00:00:00Z" },
      // The old API still sends its own ids and a url: named generically, url ignored.
      { vendor: "old_shop", status: "unknown", checked_at: "2026-11-24T00:00:00Z", url: "https://shop.example/p" } as never,
    ]),
  ).toEqual([
    { vendor: "source_a", label: "Pharmacy A", kind: "online", status: "in_stock", pricePaise: 3000, checkedAt: "2026-11-25T00:00:00Z" },
    { vendor: "source_b", label: "Pharmacy B", kind: "online", status: "out_of_stock", pricePaise: undefined, checkedAt: "2026-11-24T00:00:00Z" },
    { vendor: "old_shop", label: "Online pharmacy", kind: "online", status: "unknown", pricePaise: undefined, checkedAt: "2026-11-24T00:00:00Z" },
    { vendor: "find-a-jan-aushadhi-kendra", label: "Find a Jan Aushadhi Kendra", url: "https://example.org/kendra", kind: "store", status: "unknown" },
  ]);
  expect(vendorRows(links)).toHaveLength(1);
  expect(["source_d", "source_", "source_ab", "SOURCE_A", ""].map(vendorLabel)).toEqual([
    "Pharmacy D", "Online pharmacy", "Online pharmacy", "Online pharmacy", "Online pharmacy",
  ]);
});

test("ranking: in stock first, cheapest within; out of stock last; best option only when something is in stock", () => {
  const out = row({ label: "Out", status: "out_of_stock", pricePaise: 100 });
  const dear = row({ label: "Dear", status: "in_stock", pricePaise: 5000 });
  const cheap = row({ label: "Cheap", status: "in_stock", pricePaise: 4000 });
  const noPrice = row({ label: "NoPrice", status: "in_stock" });
  const unknownB = row({ label: "B" });
  const unknownA = row({ label: "A" });
  expect(sortRows([out, unknownB, noPrice, dear, unknownA, cheap]).map((r) => r.label)).toEqual([
    "Cheap", "Dear", "NoPrice", "A", "B", "Out",
  ]);
  expect(recommend([out, dear, cheap])).toBe(cheap);
  expect(recommend([row({ label: "Z", status: "in_stock", pricePaise: 10 }), row({ label: "Y", status: "in_stock", pricePaise: 10 })])?.label).toBe("Y");
  expect(recommend([unknownA, out])).toBeUndefined();
  expect(recommend([])).toBeUndefined();
});

test("last checked reads as relative time and flags data older than a week", () => {
  const now = Date.parse("2026-11-25T12:00:00Z");
  expect(checkedLabel("2026-11-25T11:59:40Z", now)).toBe("checked just now");
  expect(checkedLabel("2026-11-25T11:20:00Z", now)).toBe("checked 40 minutes ago");
  expect(checkedLabel("2026-11-25T09:00:00Z", now)).toBe("checked 3 hours ago");
  expect(checkedLabel("2026-11-24T11:00:00Z", now)).toBe("checked yesterday");
  expect(checkedLabel("2026-11-15T12:00:00Z", now)).toBe("checked 10 days ago (may be out of date)");
  expect(checkedLabel("garbage", now)).toBeUndefined();
});
