/**
 * Cloudflare Pages Function core: forwards /v1/* to the API on Cloud Run.
 * It adds the shared proxy secret (the API rejects requests without it) and the
 * real client IP (used for per-IP rate limiting). Client-sent copies are dropped.
 */
export interface Env {
  API_ORIGIN: string;
  PROXY_SECRET: string;
}

const STRIP = ["host", "x-nirog-proxy-key", "x-nirog-client-ip", "x-forwarded-for", "x-real-ip"];

export async function proxy(request: Request, env: Env): Promise<Response> {
  if (!env.API_ORIGIN || !env.PROXY_SECRET) {
    return Response.json({ error: "unavailable", message: "Service not configured." }, { status: 503 });
  }
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/v1/")) {
    return Response.json({ error: "not_found", message: "Not found." }, { status: 404 });
  }
  const target = new URL(url.pathname + url.search, env.API_ORIGIN);

  const headers = new Headers(request.headers);
  for (const h of STRIP) headers.delete(h);
  headers.set("x-nirog-proxy-key", env.PROXY_SECRET);
  headers.set("x-nirog-client-ip", request.headers.get("cf-connecting-ip") ?? "");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });
  return new Response(upstream.body, { status: upstream.status, headers: upstream.headers });
}
