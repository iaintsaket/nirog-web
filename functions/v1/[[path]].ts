// Cloudflare Pages adapter. Cloudflare sets cf-connecting-ip to the real client address.
// caches.default is Cloudflare's free per-location edge cache.
import { proxy, type EdgeCache, type Env } from "./proxy";

const edge = (): EdgeCache | undefined => (globalThis as { caches?: { default?: EdgeCache } }).caches?.default;

export const onRequest = (ctx: { request: Request; env: Env }): Promise<Response> =>
  proxy(ctx.request, ctx.env, ctx.request.headers.get("cf-connecting-ip") ?? "", edge());
