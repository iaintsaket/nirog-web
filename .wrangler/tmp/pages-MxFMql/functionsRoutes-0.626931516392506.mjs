import { onRequest as __v1___path___ts_onRequest } from "/Users/saket.suman/my_codes/nirog-web/functions/v1/[[path]].ts"

export const routes = [
    {
      routePath: "/v1/:path*",
      mountPath: "/v1",
      method: "",
      middlewares: [],
      modules: [__v1___path___ts_onRequest],
    },
  ]