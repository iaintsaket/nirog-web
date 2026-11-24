#!/usr/bin/env bash
# Instantly point the live site back at an earlier release. No rebuild: Cloudflare keeps every
# deployment, and each release's deployment is labelled with its version.
# Needs: CLOUDFLARE_API_TOKEN (Pages: Edit) and CLOUDFLARE_ACCOUNT_ID in the environment, curl, jq.
# Usage: deploy/rollback-pages.sh v2026.11.24.1 [project-name]
set -euo pipefail
version="${1:?usage: $0 VERSION [project]}"
project="${2:-nirog}"
: "${CLOUDFLARE_API_TOKEN:?set CLOUDFLARE_API_TOKEN}" "${CLOUDFLARE_ACCOUNT_ID:?set CLOUDFLARE_ACCOUNT_ID}"
api="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$project/deployments"
auth=(-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")

# A release is found by its label or by the commit its Git tag points to.
sha=$(git rev-list -n 1 "$version" 2>/dev/null || true)
id=""
for page in 1 2 3 4 5; do
  id=$(curl -fsS "${auth[@]}" "$api?env=production&page=$page&per_page=25" \
    | jq -r --arg v "$version" --arg s "$sha" '[.result[] | select(.deployment_trigger.metadata.commit_message == $v or (($s | length) > 0 and .deployment_trigger.metadata.commit_hash == $s))][0].id // empty')
  [ -n "$id" ] && break
done
if [ -z "$id" ]; then
  echo "No production deployment labelled $version. Versions are listed at https://github.com/iaintsaket/nirog-web/releases" >&2
  exit 1
fi
curl -fsS -X POST "${auth[@]}" "$api/$id/rollback" | jq -r '"Live site now serves \(.result.deployment_trigger.metadata.commit_message) (\(.result.url))"'
