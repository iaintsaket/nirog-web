#!/usr/bin/env bash
# Instantly point the live site back at an earlier release. No rebuild: Cloudflare keeps every
# deployment, and each release's deployment is labelled with its version.
# Needs: CLOUDFLARE_API_TOKEN (Pages: Edit) and CLOUDFLARE_ACCOUNT_ID in the environment, curl, jq.
# Usage: deploy/rollback-pages.sh v1.0.0 [project-name]
set -euo pipefail
version="${1:?usage: $0 VERSION [project]}"
project="${2:-nirog}"
: "${CLOUDFLARE_API_TOKEN:?set CLOUDFLARE_API_TOKEN}" "${CLOUDFLARE_ACCOUNT_ID:?set CLOUDFLARE_ACCOUNT_ID}"
api="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$project/deployments"
auth=(-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")

# A release is found by its label first. Only if no deployment carries the label (for example one
# deployed by hand) is it found by the commit its Git tag points to, newest such deployment first.
sha=$(git rev-parse -q --verify "$version^{commit}" 2>/dev/null || true)
pages=$(for page in 1 2 3 4; do curl -fsS "${auth[@]}" "$api?env=production&page=$page&per_page=25" | jq -c '.result[]'; done)
id=$(jq -rs --arg v "$version" '[.[] | select(.deployment_trigger.metadata.commit_message == $v)][0].id // empty' <<< "$pages")
if [ -z "$id" ] && [ -n "$sha" ]; then
  id=$(jq -rs --arg s "$sha" '[.[] | select(.deployment_trigger.metadata.commit_hash == $s)][0].id // empty' <<< "$pages")
fi
if [ -z "$id" ]; then
  echo "No production deployment labelled $version. Versions are listed at https://github.com/iaintsaket/nirog-web/releases" >&2
  exit 1
fi
curl -fsS -X POST "${auth[@]}" "$api/$id/rollback" | jq -r '"Live site now serves \(.result.deployment_trigger.metadata.commit_message) (\(.result.url))"'
