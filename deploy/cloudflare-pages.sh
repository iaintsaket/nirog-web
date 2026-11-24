#!/usr/bin/env bash
# Build the static site and upload it to Cloudflare Pages.
# Needs: wrangler logged in (wrangler login). Pages secrets API_ORIGIN and PROXY_SECRET are
# set once in the Pages project (wrangler pages secret put ...), never in this repo.
# Usage: [VERSION=v1.0.0] deploy/cloudflare-pages.sh [project-name]   (default: nirog)
# VERSION labels the Cloudflare deployment, so deploy/rollback-pages.sh can find it later.
set -euo pipefail
project="${1:-nirog}"
cd "$(dirname "$0")/.."
label="${VERSION:-manual $(git rev-parse --short HEAD)}"
npm ci
# Medicine pages are built from the API's catalogue. Fetch it unless a fresh copy is already here
# (the deploy workflow caches it per price import, so most deploys make no API calls for it).
[ -s data/medicines.json ] || node scripts/fetch-medicines.mjs "${MEDICINES_API:-https://nirog.pages.dev}" data/medicines.json
# The version is baked into the build: the footer shows it and /version.json reports it, so a
# rollback to an older build reports that build's own version.
MEDICINES_REQUIRED=1 NEXT_PUBLIC_VERSION="$label" npm run build
printf '{"version":"%s","commit":"%s"}\n' "$label" "$(git rev-parse HEAD)" > out/version.json
npx --yes wrangler@4.167.0 pages deploy out --project-name "$project" --branch main \
  --commit-hash "$(git rev-parse HEAD)" --commit-message "$label"
