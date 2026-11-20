"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CompareView } from "./CompareView";

/** Stand-alone compare page, used by saved matches and shared links. */
export function ComparePage() {
  const params = useSearchParams();
  return (
    <div className="stack">
      <p className="small">
        <Link href="/">← Search</Link>
      </p>
      <CompareView matchKey={params.get("key") ?? ""} searched={params.get("searched") ?? undefined} />
    </div>
  );
}
