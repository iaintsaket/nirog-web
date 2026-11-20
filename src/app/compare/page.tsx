import type { Metadata } from "next";
import { Suspense } from "react";
import { ComparePage } from "@/features/compare/ComparePage";

export const metadata: Metadata = { title: "Compare substitutes" };

export default function Compare() {
  return (
    <Suspense>
      <ComparePage />
    </Suspense>
  );
}
