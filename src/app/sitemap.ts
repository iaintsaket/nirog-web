import type { MetadataRoute } from "next";
import { letters, medicines } from "@/lib/medicines-data";
import { absolute } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Pages worth a search result: home, the A–Z index and every medicine page (about 10,000, under
 * the 50,000-URL limit for one sitemap). /compare, /saved and /signin are per-visitor views.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const { entries, updatedOn } = medicines();
  const lastModified = updatedOn ?? undefined;
  return [
    { url: absolute("/"), changeFrequency: "daily", priority: 1 },
    ...letters().map((l) => ({ url: absolute(`/medicines/${l}`), lastModified, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...entries.map((e) => ({ url: absolute(`/medicine/${e.slug}`), lastModified, changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: absolute("/about"), changeFrequency: "yearly", priority: 0.4 },
    { url: absolute("/privacy"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
