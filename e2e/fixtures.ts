import { test as base, expect, type Page } from "@playwright/test";
import close from "./fixtures/close.json" with { type: "json" };
import compare from "./fixtures/compare.json" with { type: "json" };
import search from "./fixtures/search.json" with { type: "json" };
import stats from "./fixtures/stats.json" with { type: "json" };

export const LIVE = !!process.env.LIVE_URL;
/** A medicine with a cheaper substitute, present in both the fixtures and the live data. */
export const QUERY = "d pan dsr";

const ANSWERS: Record<string, unknown> = { "/v1/stats": stats, "/v1/search": search, "/v1/compare": compare, "/v1/close": close };

/** Each test gets a page with /v1 answered from fixtures (unless LIVE) and fails on any script error. */
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, provide) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      // A 401 from /v1/me is expected while sign-in is hidden; resource failures are checked elsewhere.
      if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(m.text());
    });
    if (!LIVE) {
      await page.route("**/v1/**", (route) => {
        const path = new URL(route.request().url()).pathname;
        const body = ANSWERS[path];
        return body
          ? route.fulfill({ json: body })
          : route.fulfill({ status: 404, json: { error: "not_found", message: "Not in fixtures." } });
      });
    }
    await provide(page);
    expect(errors, "script errors on the page").toEqual([]);
  },
});
export { expect };

/** The page must not scroll sideways, and must end at the footer (no empty space below it). */
export async function expectTidyPage(page: Page) {
  const m = await page.evaluate(() => {
    const doc = document.documentElement;
    const footer = document.querySelector(".site-footer")!.getBoundingClientRect();
    return { scrollW: doc.scrollWidth, viewW: window.innerWidth, scrollH: doc.scrollHeight, footerEnd: footer.bottom + window.scrollY };
  });
  expect(m.scrollW, "page is wider than the screen").toBeLessThanOrEqual(m.viewW);
  expect(m.scrollH, "empty space below the footer").toBeLessThanOrEqual(Math.ceil(m.footerEnd) + 2);
}

export async function snap(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
}

/** Types the query and picks the first medicine. */
export async function pickMedicine(page: Page) {
  await page.goto(`/?q=${encodeURIComponent(QUERY)}`);
  await page.locator(".result").first().click();
  await expect(page.locator(".ladder li").first()).toBeVisible({ timeout: 20_000 });
}
