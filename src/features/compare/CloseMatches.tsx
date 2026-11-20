"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { CloseMatch } from "@/api/client";
import { closeMatches } from "@/services/catalog";
import { MedicineTile } from "./MedicineTile";

/** Nearby formulas for a medicine with no cheaper exact substitute, each saying what differs. */
export function CloseMatches({ matchKey }: { matchKey: string }) {
  const [matches, setMatches] = useState<CloseMatch[]>([]);
  const titleId = useId();
  useEffect(() => {
    let live = true;
    closeMatches(matchKey).then((r) => live && r.ok && setMatches(r.data));
    return () => {
      live = false;
    };
  }, [matchKey]);
  if (matches.length === 0) return null;
  return (
    <section className="stack close-matches" aria-labelledby={titleId}>
      <h3 id={titleId} className="h2">
        Close matches
      </h3>
      <p className="notice notice-warn small">
        <strong>Not exact substitutes.</strong> Each differs from yours as shown. Ask your doctor or pharmacist
        before switching.
      </p>
      <ul className="ladder plain">
        {matches.map((m, i) => (
          <MedicineTile
            key={m.key}
            offer={m.cheapest}
            order={i}
            pricePrefix="from "
            tags={m.differences.map((d) => (
              <span key={d} className="badge badge-diff">
                {d}
              </span>
            ))}
            footer={
              <>
                <span className="small muted">{m.salts_label}</span>
                <Link className="link-chip close-link" href={`/compare?key=${encodeURIComponent(m.key)}`}>
                  See {m.offers} {m.offers === 1 ? "price" : "prices"} →
                </Link>
              </>
            }
          />
        ))}

      </ul>
    </section>
  );
}
