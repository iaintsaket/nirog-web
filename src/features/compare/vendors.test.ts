import { expect, test } from "vitest";
import { checkedLabel, recommend, sortRows, vendorRows, type VendorRow } from "./vendors";

const row = (over: Partial<VendorRow>): VendorRow => ({
  vendor: "x",
  label: "X",
  url: "https://x.example/",
  kind: "online",
  status: "unknown",
  ...over,
});

test("today's buy links become rows whose stock is not checked yet, named by the shop", () => {
  expect(
    vendorRows([
      { kind: "online", label: "Tata 1mg", url: "https://www.1mg.com/search/all?name=dolo" },
      { kind: "online", label: "Apollo Pharmacy", url: "https://www.apollopharmacy.in/search-medicines/dolo" },
      { kind: "store", label: "Find a Jan Aushadhi Kendra", url: "not a url" },
    ]),
  ).toEqual([
    { vendor: "1mg", label: "Tata 1mg", url: "https://www.1mg.com/search/all?name=dolo", kind: "online", status: "unknown" },
    { vendor: "apollo", label: "Apollo Pharmacy", url: "https://www.apollopharmacy.in/search-medicines/dolo", kind: "online", status: "unknown" },
    { vendor: "find-a-jan-aushadhi-kendra", label: "Find a Jan Aushadhi Kendra", url: "not a url", kind: "store", status: "unknown" },
  ]);
});

test("per-vendor stock from the API wins over the links when present", () => {
  const links = [{ kind: "online" as const, label: "Netmeds", url: "https://www.netmeds.com/x" }];
  expect(
    vendorRows(links, [
      { vendor: "pharmeasy", status: "in_stock", price_paise: 3000, checked_at: "2026-11-25T00:00:00Z", url: "https://pharmeasy.in/p" },
      { vendor: "newshop", status: "out_of_stock", price_paise: null, checked_at: "2026-11-24T00:00:00Z", url: "https://n.example/" },
    ]),
  ).toEqual([
    { vendor: "pharmeasy", label: "PharmEasy", url: "https://pharmeasy.in/p", kind: "online", status: "in_stock", pricePaise: 3000, checkedAt: "2026-11-25T00:00:00Z" },
    { vendor: "newshop", label: "newshop", url: "https://n.example/", kind: "online", status: "out_of_stock", pricePaise: undefined, checkedAt: "2026-11-24T00:00:00Z" },
  ]);
  expect(vendorRows(links, [])[0].vendor).toBe("netmeds");
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
