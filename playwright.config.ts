import { defineConfig, devices } from "@playwright/test";

/**
 * Look-and-layout checks on a phone and a desktop.
 * - Default (PRs): builds nothing itself; serves the static export in out/ and answers /v1 from
 *   e2e/fixtures, so results never depend on live data.
 * - LIVE_URL=https://nirog.pages.dev: runs the same checks against the live site and real API.
 */
const live = process.env.LIVE_URL;

export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: live ?? "http://localhost:4173", trace: "retain-on-failure" },
  projects: [
    { name: "phone (Safari engine)", use: { ...devices["iPhone 15"] } },
    { name: "phone (Chrome)", use: { ...devices["Pixel 7"] } },
    { name: "desktop (Chrome)", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: live
    ? undefined
    : { command: "node e2e/serve.mjs 4173", url: "http://localhost:4173", reuseExistingServer: !process.env.CI },
});
