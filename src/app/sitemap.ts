import type { MetadataRoute } from "next";
import { absolute } from "@/lib/site";

export const dynamic = "force-static";

/** Pages worth a search result. /compare, /saved and /signin are per-visitor views, so they are left out. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absolute("/"), changeFrequency: "daily", priority: 1 },
    { url: absolute("/privacy"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
