"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/AuthProvider";
import { compareHref } from "@/lib/medicines";

/** A signed-in user's last opened medicines as chips under the home search, with Clear. */
export function RecentChips() {
  const { recent, clearRecent } = useAuth();
  if (recent.length === 0) return null;
  return (
    <div className="recent intro">
      <span className="recent-title small muted">Recent</span>
      <ul className="recent-list plain" aria-label="Recently opened medicines">
        {recent.map((r) => (
          <li key={r.key}>
            <Link className="chip" href={compareHref(r.key, r.offer_id ?? undefined)}>
              {r.label}
            </Link>
          </li>
        ))}
      </ul>
      <button type="button" className="link-button small" aria-label="Clear recent medicines" onClick={() => void clearRecent()}>
        Clear
      </button>
    </div>
  );
}
