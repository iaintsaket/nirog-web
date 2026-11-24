import { expect, test, vi } from "vitest";
import { onRequest } from "./[[path]]";
import { proxy } from "./proxy";

const env = { API_ORIGIN: "https://api.example.run.app", PROXY_SECRET: "s".repeat(40) };

test("forwards to the API with the proxy secret and real client IP, dropping spoofed headers", async () => {
  const upstream = vi.fn(async () => new Response("{}", { status: 201, headers: { "set-cookie": "a=b" } }));
  vi.stubGlobal("fetch", upstream);
  const req = new Request("https://nirog.pages.dev/v1/saved?x=1", {
    method: "POST",
    body: '{"key":"k"}',
    headers: { "cf-connecting-ip": "203.0.113.9", "x-nirog-proxy-key": "forged", "x-nirog-client-ip": "1.1.1.1", cookie: "s=1" },
  });

  const res = await onRequest({ request: req, env });

  expect(res.status).toBe(201);
  expect(res.headers.get("set-cookie")).toBe("a=b");
  const [url, init] = upstream.mock.calls[0] as unknown as [URL, RequestInit];
  expect(url.toString()).toBe("https://api.example.run.app/v1/saved?x=1");
  const h = new Headers(init.headers);
  expect(h.get("x-nirog-proxy-key")).toBe(env.PROXY_SECRET);
  expect(h.get("x-nirog-client-ip")).toBe("203.0.113.9");
  expect(h.get("cookie")).toBe("s=1");
  expect(init.redirect).toBe("manual"); // OAuth 303s must reach the browser
  expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe('{"key":"k"}');
});

test("the core proxy trusts only the client IP its host adapter passes in", async () => {
  const upstream = vi.fn(async () => new Response("{}"));
  vi.stubGlobal("fetch", upstream);
  const req = new Request("https://nirog.example/v1/health", { headers: { "cf-connecting-ip": "203.0.113.9" } });

  await proxy(req, env, "198.51.100.7");

  const [, init] = upstream.mock.calls[0] as unknown as [URL, RequestInit];
  expect(new Headers(init.headers).get("x-nirog-client-ip")).toBe("198.51.100.7");
});

test("refuses when unconfigured or outside /v1", async () => {
  const req = new Request("https://nirog.pages.dev/v1/health");
  expect((await proxy(req, { API_ORIGIN: "", PROXY_SECRET: "" }, "")).status).toBe(503);
  expect((await proxy(new Request("https://nirog.pages.dev/other"), env, "")).status).toBe(404);
});

/** Stands in for Cloudflare's edge cache (caches.default), keyed by URL. */
function edgeCache() {
  const store = new Map<string, Response>();
  return {
    store,
    match: async (req: Request) => store.get(req.url)?.clone(),
    put: async (req: Request, res: Response) => void store.set(req.url, res),
  };
}

test("public GET replies are served from the edge cache, so repeat visits skip the API", async () => {
  const upstream = vi.fn(async () => new Response('{"offers":1}', { headers: { "cache-control": "public, max-age=300, s-maxage=3600" } }));
  vi.stubGlobal("fetch", upstream);
  const cache = edgeCache();
  const get = () => proxy(new Request("https://nirog.pages.dev/v1/stats", { headers: { cookie: "s=1" } }), env, "1.2.3.4", cache);

  const first = await get();
  expect(first.headers.get("x-nirog-cache")).toBe("miss");
  expect(await first.text()).toBe('{"offers":1}');
  const second = await get();
  expect(second.headers.get("x-nirog-cache")).toBe("hit");
  expect(await second.text()).toBe('{"offers":1}');
  expect(upstream).toHaveBeenCalledTimes(1);
});

test("private, failed, cookie-setting, signed or non-GET replies are never cached", async () => {
  const cache = edgeCache();
  const cases: [Request, Response][] = [
    [new Request("https://nirog.pages.dev/v1/me"), new Response("{}", { headers: { "cache-control": "private, no-store" } })],
    [new Request("https://nirog.pages.dev/v1/search?q=x"), new Response("{}", { status: 503, headers: { "cache-control": "public, max-age=300" } })],
    [new Request("https://nirog.pages.dev/v1/compare?key=k"), new Response("{}", { headers: { "cache-control": "public, max-age=300", "set-cookie": "a=b" } })],
    [new Request("https://nirog.pages.dev/v1/stats", { headers: { authorization: "Bearer t" } }), new Response("{}", { headers: { "cache-control": "public, max-age=300" } })],
    [new Request("https://nirog.pages.dev/v1/saved", { method: "POST", body: "{}" }), new Response("{}", { headers: { "cache-control": "public, max-age=300" } })],
  ];
  for (const [req, res] of cases) {
    vi.stubGlobal("fetch", vi.fn(async () => res));
    await proxy(req, env, "1.2.3.4", cache);
  }
  expect(cache.store.size).toBe(0);
});
