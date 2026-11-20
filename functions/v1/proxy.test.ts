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

test("refuses when unconfigured or outside /v1", async () => {
  const req = new Request("https://nirog.pages.dev/v1/health");
  expect((await proxy(req, { API_ORIGIN: "", PROXY_SECRET: "" })).status).toBe(503);
  expect((await proxy(new Request("https://nirog.pages.dev/other"), env)).status).toBe(404);
});
