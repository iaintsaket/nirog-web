import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchFallback } from "@/features/search/Intro";
import { SearchPage } from "@/features/search/SearchPage";
import { homeJsonLd, jsonLd, pageMeta, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

// The home page shows the site's own title, without the layout's suffix.
export const metadata: Metadata = pageMeta({ path: "/", title: SITE_TITLE, description: SITE_DESCRIPTION, suffix: false });

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(homeJsonLd()) }} />
      <Suspense fallback={<SearchFallback />}>
        <SearchPage />
      </Suspense>
    </>
  );
}
