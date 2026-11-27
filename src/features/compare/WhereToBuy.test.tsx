import { render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { vendorRows } from "./vendors";
import { WhereToBuy } from "./WhereToBuy";

const now = new Date().toISOString();

test("where to buy: pharmacies under generic names, best option marked, out of stock last, no outside links", () => {
  // Old API: an online search link and per-vendor urls; new API: source ids and no url. Neither may become a link.
  const rows = vendorRows(
    [{ kind: "online", label: "Some Shop", url: "https://shop.example/search?q=dolo" }],
    [
      { vendor: "source_c", display_name: "Pharmacy c", status: "out_of_stock", price_paise: 2500, checked_at: now },
      { vendor: "source_b", display_name: "Pharmacy b", status: "in_stock", price_paise: 3000, checked_at: now },
      { vendor: "source_a", display_name: "Pharmacy a", status: "in_stock", price_paise: 2800, checked_at: now },
      { vendor: "source_d", display_name: "Pharmacy d", status: "unknown", checked_at: now },
      { vendor: "old_shop", status: "in_stock", price_paise: 3500, checked_at: now, url: "https://shop.example/p" } as never,
    ],
  );
  render(<WhereToBuy name="Dolo 650" rows={rows} />);
  const section = screen.getByRole("region", { name: "Where to buy for Dolo 650" });
  const items = within(section).getAllByRole("listitem");
  expect(items.map((li) => li.textContent)).toEqual([
    "Pharmacy A★ Best option✓ In stock₹28.00checked just now",
    "Pharmacy B✓ In stock₹30.00checked just now",
    "Online pharmacy✓ In stock₹35.00checked just now",
    "Pharmacy D? Not checked yetchecked just now",
    "Pharmacy C✕ Out of stock₹25.00checked just now",
  ]);
  expect(items[4]).toHaveClass("wtb-out_of_stock");
  expect(within(section).queryByRole("link")).not.toBeInTheDocument();
  expect(section).not.toHaveTextContent(/Some Shop|shop\.example|Buy on/);
  expect(section).toHaveTextContent("Nirog does not sell medicines.");
});

test("where to buy: Jan Aushadhi rows find a Kendra instead of buying online; nothing renders without rows", () => {
  const { container } = render(<WhereToBuy rows={[]} />);
  expect(container).toBeEmptyDOMElement();
  render(<WhereToBuy janAushadhi rows={vendorRows([{ kind: "store", label: "Find a Jan Aushadhi Kendra", url: "https://example.org/kendra" }])} />);
  const section = screen.getByRole("region", { name: "Where to buy" });
  expect(section).toHaveTextContent("Sold only at Jan Aushadhi Kendras, not online.");
  const kendra = within(section).getByRole("link", { name: /^Find a Jan Aushadhi Kendra/ });
  expect(kendra).toHaveAttribute("href", "https://example.org/kendra");
  expect(kendra).toHaveAttribute("target", "_blank");
  expect(kendra).toHaveAttribute("rel", "noopener noreferrer nofollow");
  expect(within(section).queryByText(/Buy on|Not checked yet/)).not.toBeInTheDocument();
});
