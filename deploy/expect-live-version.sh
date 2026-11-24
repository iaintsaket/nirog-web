#!/usr/bin/env bash
# Waits up to a minute for https://nirog.pages.dev/version.json to report the expected version.
# Usage: deploy/expect-live-version.sh v1.0.1 [site]
set -euo pipefail
want="${1:?usage: $0 VERSION [site]}"
site="${2:-https://nirog.pages.dev}"
for _ in $(seq 1 12); do
  got=$(curl -fsS -H 'cache-control: no-cache' "$site/version.json?t=$(date +%s)" | jq -r .version 2>/dev/null || true)
  [ "$got" = "$want" ] && { echo "Live version: $got"; exit 0; }
  sleep 5
done
echo "Live site reports '${got:-nothing}', expected $want" >&2
exit 1
