import { LIVE, expect, expectTidyPage, pickMedicine, snap, test } from "./fixtures";
import compareFixture from "./fixtures/compare.json" with { type: "json" };

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
    await expect(page.getByRole("heading", { level: 1, name: "Health for everyone, everywhere" })).toBeAttached();
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

test("where to buy: the comparison window lists each shop as a full-width row with a Buy button, tidy", async ({ page }) => {
  test.skip(LIVE, "uses fixture buy links");
  const body: { offers: { links: object[] }[] } = structuredClone(compareFixture);
  const q = "Samplebrand";
  body.offers[1].links = [
    { kind: "online", label: "Tata 1mg", url: `https://www.1mg.com/search/all?name=${q}` },
    { kind: "online", label: "PharmEasy", url: `https://pharmeasy.in/search/all?name=${q}` },
    { kind: "online", label: "Netmeds", url: `https://www.netmeds.com/catalogsearch/result/${q}/all` },
    { kind: "online", label: "Apollo Pharmacy", url: `https://www.apollopharmacy.in/search-medicines/${q}` },
  ];
  await page.route((u) => u.pathname === "/v1/compare", (r) => r.fulfill({ json: body }));
  await pickMedicine(page);
  await page.locator(".ladder li.rung-clickable").first().click();
  const dialog = page.getByRole("dialog");
  const section = dialog.getByRole("region", { name: /^Where to buy/ });
  await expect(section.getByRole("listitem")).toHaveCount(4);
  const buy = section.getByRole("link", { name: /^Buy on PharmEasy/ });
  await expect(buy).toHaveAttribute("rel", "noopener noreferrer nofollow");

  // Measure after the window's entrance animation (it scales up from 98%).
  await dialog.evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished)));
  // Every row spans the section, and its Buy button stays inside it.
  const box = (await section.boundingBox())!;
  for (const row of await section.getByRole("listitem").all()) {
    const r = (await row.boundingBox())!;
    expect(Math.abs(r.width - box.width), "row spans the section").toBeLessThanOrEqual(1);
    const b = (await row.getByRole("link").boundingBox())!;
    expect(b.x + b.width, "Buy button inside its row").toBeLessThanOrEqual(r.x + r.width + 1);
    expect(b.height, "Buy button is a real tap target").toBeGreaterThanOrEqual(40);
  }
  const sideways = await dialog.evaluate((d) => d.scrollWidth - d.clientWidth);
  expect(sideways, "comparison window scrolls sideways").toBeLessThanOrEqual(0);
  await section.scrollIntoViewIfNeeded();
  await test.info().attach("where to buy", { body: await section.screenshot(), contentType: "image/png" });
  await test.info().attach("where to buy (window)", { body: await page.screenshot(), contentType: "image/png" });
});
