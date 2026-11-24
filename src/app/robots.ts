import type { MetadataRoute } from "next";
import { absolute } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Crawlers that train AI models or build SEO/data indexes. They bring no search visitors and
 * would only add load, so they are asked to stay away entirely. Search engines are not listed.
 * Google-Extended and Applebot-Extended only opt out of AI training; Google and Apple search still index.
 */
const BANNED = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "CCBot",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "Google-Extended",
  "Applebot-Extended",
  "PerplexityBot",
  "Bytespider",
  "meta-externalagent",
  "Amazonbot",
  "cohere-ai",
  "Diffbot",
  "omgili",
  "ImagesiftBot",
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "DataForSeoBot",
  "BLEXBot",
  "PetalBot",
];

/**
 * robots.txt is a request, not a lock: polite crawlers follow it. The real limits are the API's
 * proxy secret, per-IP rate limit and the edge cache.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Search engines index the static medicine pages; nothing that calls the API or is per-visitor.
      { userAgent: "*", allow: "/", disallow: ["/v1/", "/compare", "/*?q=", "/saved", "/signin"] },
      { userAgent: BANNED, disallow: "/" },
    ],
    sitemap: absolute("/sitemap.xml"),
  };
}
