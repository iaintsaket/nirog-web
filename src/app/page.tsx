import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchFallback } from "@/features/search/Intro";
import { SearchPage } from "@/features/search/SearchPage";
import { homeJsonLd, jsonLd } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

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
