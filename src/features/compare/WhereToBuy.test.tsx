import { render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import type { VendorRow } from "./vendors";
import { WhereToBuy } from "./WhereToBuy";

const row = (over: Partial<VendorRow>): VendorRow => ({
  vendor: over.label!.toLowerCase(),
  label: "X",
  url: `https://${over.label!.toLowerCase()}.example/`,
  kind: "online",
  status: "unknown",
  ...over,
});

test("where to buy: one row per vendor, best option marked, out of stock last, status in words", () => {
  render(
    <WhereToBuy
      name="Dolo 650"
      rows={[
        row({ label: "Netmeds", status: "out_of_stock", pricePaise: 2500, checkedAt: new Date().toISOString() }),
        row({ label: "PharmEasy", status: "in_stock", pricePaise: 3000 }),
        row({ label: "Apollo", status: "in_stock", pricePaise: 2800 }),
        row({ label: "Tata 1mg" }),
      ]}
    />,
  );
  const section = screen.getByRole("region", { name: "Where to buy for Dolo 650" });
  const items = within(section).getAllByRole("listitem");
  expect(items.map((li) => li.textContent)).toEqual([
    "Apollo★ Best option✓ In stock₹28.00Buy on Apollo ↗ (opens in a new tab)",
    "PharmEasy✓ In stock₹30.00Buy on PharmEasy ↗ (opens in a new tab)",
    "Tata 1mg? Not checked yetBuy on Tata 1mg ↗ (opens in a new tab)",
    "Netmeds✕ Out of stock₹25.00checked just nowBuy on Netmeds ↗ (opens in a new tab)",
  ]);
  expect(items[3]).toHaveClass("wtb-out_of_stock");
  const buy = within(items[0]).getByRole("link", { name: "Buy on Apollo (opens in a new tab)" });
  expect(buy).toHaveAttribute("href", "https://apollo.example/");
  expect(buy).toHaveAttribute("target", "_blank");
  expect(buy).toHaveAttribute("rel", "noopener noreferrer nofollow");
  expect(section).toHaveTextContent("Nirog does not sell medicines.");
});

test("where to buy: Jan Aushadhi rows find a Kendra instead of buying online; nothing renders without rows", () => {
  const { container } = render(<WhereToBuy rows={[]} />);
  expect(container).toBeEmptyDOMElement();
  render(<WhereToBuy janAushadhi rows={[row({ label: "Find a Jan Aushadhi Kendra", kind: "store" })]} />);
  const section = screen.getByRole("region", { name: "Where to buy" });
  expect(section).toHaveTextContent("Sold only at Jan Aushadhi Kendras, not online.");
  expect(within(section).getByRole("link", { name: /^Find a Jan Aushadhi Kendra/ })).toBeInTheDocument();
  expect(within(section).queryByText(/Buy on|Not checked yet/)).not.toBeInTheDocument();
});
