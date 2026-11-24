# nirog-web

The website for **Project Nirog**: search a medicine you buy in India and find exact substitutes
(same salts, strength, form and release) from Jan Aushadhi and other brands, cheapest first.

The API lives in [iaintsaket/nirog-api](https://github.com/iaintsaket/nirog-api).

> Nirog compares prices only. It is not medical advice.

## Layout

| Path | Role |
|---|---|
| `src/app` | Routes: `/` search, `/compare`, `/saved`, `/signin`, `/privacy` (static export). |
| `src/features` | UI by feature: search, compare, saved, auth. |
| `src/services` | Calls to the API, returning typed `Result`s. |
| `src/api` | Client generated from the API's `openapi.json` (`npm run gen:api`). Do not edit `schema.d.ts`. |
| `functions/v1` | Proxies `/v1/*` to the API with the proxy secret. `proxy.ts` is host-neutral; `[[path]].ts` is the Cloudflare Pages adapter. |
| `deploy` | One script per host. |

## Run locally

Start [nirog-api](https://github.com/iaintsaket/nirog-api) on port 8080 with
`WEB_ORIGIN=http://localhost:3000 SECURE_COOKIES=false`, then:

```bash
npm ci
npm run dev        # http://localhost:3000, /v1 is proxied to localhost:8080
```

## Checks

Every pull request must pass `ci`: generated client matches the API spec, ESLint, TypeScript,
Vitest with at least 80% coverage, the production build, `npm audit` and gitleaks. CodeQL runs alongside.

## Deploy

The site is a static export (`npm run build` writes `out/`), so any static host can serve it. Only `/v1/*` needs code at the edge: it must reach the API with two settings.

| Setting | Meaning |
|---|---|
| `API_ORIGIN` | Where the API runs, for example `https://nirog-api-xxxx.a.run.app`. |
| `PROXY_SECRET` | The same value the API has. Keep it in the host's secret store. |
| `NEXT_PUBLIC_SIGN_IN` | Build-time. `on` shows Google sign-in and saved medicines; anything else hides them (the launch default). |

- **Cloudflare Pages (current):** merging to `main` deploys automatically once CI passes (`.github/workflows/deploy.yml`, which runs `deploy/cloudflare-pages.sh`). To deploy by hand, run the script. Set both settings once with `npx wrangler pages secret put <NAME> --project-name nirog`.
- **Another host (for example AWS CloudFront with Lambda@Edge, or Vercel):** upload `out/`, then add a small adapter beside `[[path]].ts` that calls `proxy(request, env, clientIp)` with the platform's client IP. `proxy.ts` does not change.

## Releases and rollback

Every deploy from `main` is a release named by date, such as `v2026.11.24.1`: a Git tag, a [GitHub Release](https://github.com/iaintsaket/nirog-web/releases) listing its PRs, and the same label on the Cloudflare deployment. If the live checks fail after a deploy, the release title says so.

To go back, open **Actions → rollback → Run workflow** and enter a version. The live site switches to that release's deployment in seconds, with no rebuild. Locally: `deploy/rollback-pages.sh <version>` with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` set. Then revert the bad PR so `main` matches what is live.

## License

[MIT](LICENSE)
