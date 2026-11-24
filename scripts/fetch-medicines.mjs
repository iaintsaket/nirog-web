// Fetches every medicine page from the API for the static build: ~20 requests in all.
// Usage: node scripts/fetch-medicines.mjs <api origin> [out file]
//   e.g. node scripts/fetch-medicines.mjs https://nirog.pages.dev data/medicines.json
// PAGES_TOKEN (deploy secret) is sent to /v1/pages, which the API keeps for the deploy only.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const [origin, out = "data/medicines.json"] = process.argv.slice(2);
if (!origin) {
  console.error("usage: node scripts/fetch-medicines.mjs <api origin> [out file]");
  process.exit(2);
}

const token = process.env.PAGES_TOKEN;

async function get(path) {
  const headers = { accept: "application/json" };
  if (token && path.startsWith("/v1/pages")) headers.authorization = `Bearer ${token}`;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(new URL(path, origin), { headers });
    if (res.ok) return res.json();
    // Stay well inside the API's per-client rate limit; retry only what can succeed later.
    if (attempt < 6 && (res.status === 429 || res.status >= 500)) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      continue;
    }
    throw new Error(`${path}: HTTP ${res.status}`);
  }
}

const stats = await get("/v1/stats");
const pages = [];
let after = null;
do {
  const batch = await get(`/v1/pages${after ? `?after=${encodeURIComponent(after)}` : ""}`);
  pages.push(...batch.pages);
  after = batch.next ?? null;
  await new Promise((r) => setTimeout(r, 300));
} while (after);

if (pages.length === 0) throw new Error("the API returned no medicine pages");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ updated_on: stats.prices_updated_on ?? null, pages }));
console.log(`${pages.length} medicine pages, prices as of ${stats.prices_updated_on}, written to ${out}`);
