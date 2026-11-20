import type { NextConfig } from "next";

// Production is a static export served by Cloudflare Pages; /v1/* goes through the
// Pages Function in functions/v1. In development, Next proxies /v1/* to a local API.
const isDev = process.env.NODE_ENV === "development";
const apiOrigin = process.env.NIROG_API_ORIGIN ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  poweredByHeader: false,
  ...(isDev && {
    async rewrites() {
      return [{ source: "/v1/:path*", destination: `${apiOrigin}/v1/:path*` }];
    },
  }),
};

export default nextConfig;
