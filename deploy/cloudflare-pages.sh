#!/usr/bin/env bash
# Build the static site and upload it to Cloudflare Pages.
# Needs: wrangler logged in (wrangler login). Pages secrets API_ORIGIN and PROXY_SECRET are
# set once in the Pages project (wrangler pages secret put ...), never in this repo.
# Usage: [VERSION=v2026.11.24.1] deploy/cloudflare-pages.sh [project-name]   (default: nirog)
# VERSION labels the Cloudflare deployment, so deploy/rollback-pages.sh can find it later.
set -euo pipefail
project="${1:-nirog}"
cd "$(dirname "$0")/.."
npm ci
npm run build
npx --yes wrangler@4.167.0 pages deploy out --project-name "$project" --branch main \
  --commit-hash "$(git rev-parse HEAD)" --commit-message "${VERSION:-manual $(git rev-parse --short HEAD)}"
