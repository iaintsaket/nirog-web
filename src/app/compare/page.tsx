import type { Metadata } from "next";
import { Suspense } from "react";
import { ComparePage } from "@/features/compare/ComparePage";

// One shell for every medicine (?key=…): kept out of the index; links on it are still followed.
export const metadata: Metadata = { title: "Compare substitutes", robots: { index: false, follow: true } };

export default function Compare() {
  return (
    <Suspense>
      <ComparePage />
    </Suspense>
  );
}
