import { proxy, type Env } from "./proxy";

export const onRequest = (ctx: { request: Request; env: Env }): Promise<Response> =>
  proxy(ctx.request, ctx.env);
