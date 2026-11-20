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
| `functions/v1` | Cloudflare Pages Function that proxies `/v1/*` to the API with the proxy secret. |

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

## License

[MIT](LICENSE)
