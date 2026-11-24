// After `next build`: keep the static export inside Cloudflare Pages' file limit.
// Each pre-built medicine page also gets RSC payload files (*.txt and a folder of segments) that
// only in-app navigation uses. Links to these pages are plain <a>, so a visit loads the .html
// and never asks for them. Dropping them takes ~49,000 files down to ~10,000.
import { readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = process.argv[2] ?? "out";
/** Cloudflare Pages (free) serves at most 20,000 files; keep a margin for growth. */
const LIMIT = 19_000;

{
  const root = join(OUT, "medicine");
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    if (name.endsWith(".txt") || statSync(path).isDirectory()) rmSync(path, { recursive: true });
  }
}

let files = 0;
const walk = (d) => {
  for (const name of readdirSync(d)) {
    const p = join(d, name);
    if (statSync(p).isDirectory()) walk(p);
    else files++;
  }
};
walk(OUT);
console.log(`static export: ${files} files (limit ${LIMIT})`);
if (files > LIMIT) {
  console.error(`too many files for Cloudflare Pages: ${files} > ${LIMIT}`);
  process.exit(1);
}
