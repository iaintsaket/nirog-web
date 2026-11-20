# Security policy

Please report vulnerabilities privately through
[GitHub private vulnerability reporting](https://github.com/iaintsaket/nirog-web/security/advisories/new).
Do not open a public issue. You will get a reply within 7 days.

The site is static. All API calls go to `/v1/*` on the same origin, where a Cloudflare Pages
Function (`functions/v1`) adds the shared proxy secret and the real client IP before forwarding
to the API. Client-sent copies of those headers are dropped. Security headers, including a strict
Content-Security-Policy, are set in `public/_headers`.
