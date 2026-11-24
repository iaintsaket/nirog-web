#!/usr/bin/env bash
# Build the static site and upload it to Cloudflare Pages.
# Needs: wrangler logged in (wrangler login). Pages secrets API_ORIGIN and PROXY_SECRET are
# set once in the Pages project (wrangler pages secret put ...), never in this repo.
# Usage: deploy/cloudflare-pages.sh [project-name]   (default: nirog)
set -euo pipefail
project="${1:-nirog}"
cd "$(dirname "$0")/.."
npm ci
npm run build
npx wrangler pages deploy out --project-name "$project" --branch main
