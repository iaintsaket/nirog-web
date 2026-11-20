import { expect, test } from "vitest";
import { packLabel, percent, rupees, sourceLabel, unitPriceLabel } from "./format";

test("formats prices, packs, unit prices and savings for display", () => {
  expect(rupees(123456)).toBe("₹1,234.56");
  expect(packLabel(1, "unit")).toBe("1 tablet/capsule");
  expect(packLabel(10, "unit")).toBe("10 tablets/capsules");
  expect(packLabel(100, "ml")).toBe("100 ml");
  expect(unitPriceLabel(90800, "unit")).toBe("₹0.91 per tablet/capsule");
  expect(unitPriceLabel(50000, "g")).toBe("₹0.50 per g");
  expect(percent(9599)).toBe("95%"); // rounds down, never overstates a saving
  expect(sourceLabel("jan_aushadhi")).toBe("Jan Aushadhi");
  expect(sourceLabel("brand")).toBe("Brand");
});
