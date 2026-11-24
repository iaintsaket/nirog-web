// Cloudflare Pages adapter. Cloudflare sets cf-connecting-ip to the real client address.
import { proxy, type Env } from "./proxy";

export const onRequest = (ctx: { request: Request; env: Env }): Promise<Response> =>
  proxy(ctx.request, ctx.env, ctx.request.headers.get("cf-connecting-ip") ?? "");
