import { Suspense } from "react";
import { SearchPage } from "@/features/search/SearchPage";

export default function Home() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
