/**
 * Host-neutral proxy core: forwards /v1/* to the API wherever it runs.
 * It adds the shared proxy secret (the API rejects requests without it) and the
 * real client IP (used for per-IP rate limiting). Client-sent copies are dropped.
 * Only the host adapter knows how its platform reports the client IP
 * (Cloudflare: functions/v1/[[path]].ts). Moving hosts means a new adapter, not edits here.
 */
export interface Env {
  API_ORIGIN: string;
  PROXY_SECRET: string;
}

/** The slice of Cloudflare's Cache API the proxy uses (caches.default in production). */
export interface EdgeCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

/**
 * Only GETs without credentials are looked up, and only a 200 the API marks `public`
 * (with no cookie set) is stored, for as long as its Cache-Control allows. Public catalog
 * routes never read the session, so a shared copy is the same for every visitor.
 */
const cacheable = (req: Request) => req.method === "GET" && !req.headers.has("authorization");
const storable = (res: Response) =>
  res.status === 200 && !res.headers.has("set-cookie") && /(^|,)\s*public\b/i.test(res.headers.get("cache-control") ?? "");

const STRIP = ["host", "x-nirog-proxy-key", "x-nirog-client-ip", "x-forwarded-for", "x-real-ip"];

export async function proxy(request: Request, env: Env, clientIp: string, cache?: EdgeCache): Promise<Response> {
  if (!env.API_ORIGIN || !env.PROXY_SECRET) {
    return Response.json({ error: "unavailable", message: "Service not configured." }, { status: 503 });
  }
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/v1/")) {
    return Response.json({ error: "not_found", message: "Not found." }, { status: 404 });
  }
  const target = new URL(url.pathname + url.search, env.API_ORIGIN);
  const key = cache && cacheable(request) ? new Request(url.toString()) : undefined;
  if (key) {
    const hit = await cache!.match(key);
    if (hit) return tagged(hit, "hit");
  }

  const headers = new Headers(request.headers);
  for (const h of STRIP) headers.delete(h);
  headers.set("x-nirog-proxy-key", env.PROXY_SECRET);
  headers.set("x-nirog-client-ip", clientIp);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });
  const response = new Response(upstream.body, { status: upstream.status, headers: upstream.headers });
  if (!key) return response;
  if (storable(response)) await cache!.put(key, response.clone());
  return tagged(response, "miss");
}

/** Marks where a reply came from, so `curl -I` shows whether the cache is working. */
function tagged(res: Response, how: "hit" | "miss"): Response {
  const out = new Response(res.body, res);
  out.headers.set("x-nirog-cache", how);
  return out;
}
