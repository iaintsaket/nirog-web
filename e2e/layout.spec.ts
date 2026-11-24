import { LIVE, expect, expectTidyPage, pickMedicine, snap, test } from "./fixtures";

const isPhone = (w: number) => w <= 760;

test("home: renders the search and live figures, tidy at this size", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("searchbox").or(page.getByRole("combobox")).first()).toBeVisible();
  await expect(page.getByText(/Prices updated/)).toBeVisible({ timeout: 20_000 });
  await expectTidyPage(page);
  await snap(page, "home");
});

test("search: results list, tidy", async ({ page }) => {
  await page.goto(`/?q=${encodeURIComponent("d pan dsr")}`);
  await expect(page.locator(".result").first()).toBeVisible({ timeout: 20_000 });
  await expectTidyPage(page);
  await snap(page, "search results");
});

test("prices: open from a picked medicine and close again", async ({ page, viewport }) => {
  await pickMedicine(page);
  const sheet = page.locator(".search-right");
  await snap(page, "prices open");

  if (!isPhone(viewport!.width)) {
    // Desktop: prices sit beside the list, not over it.
    const left = await page.locator(".search-left").boundingBox();
    const right = (await sheet.boundingBox())!;
    expect(right.x, "prices panel beside the list").toBeGreaterThanOrEqual(left!.x + left!.width - 2);
    await expectTidyPage(page);
    return;
  }

  // Phone: a solid bottom sheet whose bar spans it edge to edge.
  await expect(page.locator(".sheet-open")).toHaveCount(1);
  const look = await page.evaluate(() => {
    const s = document.querySelector(".search-right")!;
    const bar = document.querySelector(".sheet-bar")!;
    return {
      bg: getComputedStyle(s).backgroundColor,
      barBg: getComputedStyle(bar).backgroundColor,
      sheetW: s.getBoundingClientRect().width,
      barW: bar.getBoundingClientRect().width,
    };
  });
  for (const [what, c] of [["sheet", look.bg], ["sheet bar", look.barBg]]) {
    // Handles rgb(), rgba() and color(srgb r g b / a); no alpha means fully solid.
    const m = /\/\s*([\d.]+)\s*\)$/.exec(c) ?? /rgba\([^)]*,\s*([\d.]+)\)$/.exec(c);
    expect(m ? Number(m[1]) : 1, `${what} background is see-through (${c})`).toBe(1);
  }
  expect(Math.abs(look.sheetW - look.barW), "sheet bar spans the sheet").toBeLessThanOrEqual(1);

  // Drag the bar down to close.
  const bar = (await page.locator(".sheet-bar").boundingBox())!;
  await page.mouse.move(bar.x + 40, bar.y + bar.height / 2);
  await page.mouse.down();
  await page.mouse.move(bar.x + 40, bar.y + 220, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator(".sheet-open")).toHaveCount(0);

  // Open again and use the Close button.
  await page.locator(".result").first().click();
  await expect(page.locator(".sheet-open")).toHaveCount(1);
  await page.locator(".sheet-bar").getByRole("button", { name: "Close" }).click();
  await expect(page.locator(".sheet-open")).toHaveCount(0);
  await expectTidyPage(page);
});

test("privacy: renders, tidy", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectTidyPage(page);
  await snap(page, "privacy");
});

test.describe("live only", () => {
  test.skip(!LIVE, "needs the live API");
  test("the API refuses calls that skip the website's proxy", async ({ request }) => {
    const res = await request.get("https://nirog-api-1037492431911.asia-southeast1.run.app/v1/search?q=dolo");
    expect(res.status()).toBe(403);
  });
});

test.describe("search engines", () => {
  test.use({ javaScriptEnabled: false });
  test("home: heading, canonical, preview and structured data are in the HTML itself", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Pay less for the same medicine" })).toBeAttached();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/[^/]+\/?$/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  });
});

test("medicine page: pre-built comparison with no API calls, reachable from the A–Z index", async ({ page }) => {
  const api: string[] = [];
  page.on("request", (r) => new URL(r.url()).pathname.startsWith("/v1/") && api.push(r.url()));
  await page.goto("/medicines/p");
  await page.getByRole("link", { name: "Paracetamol 650mg tablet", exact: true }).click();
  await expect(page).toHaveURL(/\/medicine\/paracetamol-650mg-tablet$/);
  await expect(page.getByRole("heading", { level: 1, name: "Paracetamol 650mg tablet" })).toBeVisible();
  await expect(page.locator(".ladder li").first()).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/medicine\/paracetamol-650mg-tablet$/);
  await expectTidyPage(page);
  await snap(page, "medicine");
  expect(api.filter((u) => !u.endsWith("/v1/me"))).toEqual([]);
});

test("home: the figures' loading placeholder sits exactly where the figures land", async ({ page }) => {
  test.skip(LIVE, "needs a slow /v1/stats");
  const span = async (cards: import("@playwright/test").Locator) => {
    const [a, b] = await Promise.all([cards.first().boundingBox(), cards.last().boundingBox()]);
    return [Math.round(Math.min(a!.x, b!.x)), Math.round(Math.max(a!.x + a!.width, b!.x + b!.width))];
  };
  // Where the real figures land.
  await page.goto("/");
  const figures = page.getByRole("region", { name: "Our prices in numbers" }).locator(".home-stat");
  await expect(figures.first()).toBeVisible({ timeout: 20_000 });
  // Measure after the entrance animation (it scales cards up from 98%).
  await figures.last().evaluate((e) => Promise.all(e.getAnimations().map((a) => a.finished)));
  const landed = await span(figures);

  // Database down: the figures take a while and then fail. The placeholder must not sit elsewhere.
  await page.route("**/v1/stats", async (r) => {
    await new Promise((done) => setTimeout(done, 3000));
    await r.fulfill({ status: 503, json: { error: "unavailable", message: "Down." } });
  });
  await page.reload();
  const placeholder = page.getByLabel("Loading figures");
  await expect(placeholder).toBeVisible();
  expect(await span(placeholder.locator(".home-stat"))).toEqual(landed);
  await expect(placeholder).toBeHidden({ timeout: 6000 });
});
