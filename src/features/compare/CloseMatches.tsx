"use client";

import Link from "next/link";
import { useEffect, useId, useState, type CSSProperties } from "react";
import type { CloseMatch } from "@/api/client";
import { SourceBadge } from "@/features/search/SourceBadge";
import { shortUnitPrice } from "@/lib/format";
import { closeMatches } from "@/services/catalog";

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
          <li key={m.key} className="rung close-card card-in" style={{ "--i": i } as CSSProperties}>
            <div className="rung-top">
              <strong className="rung-title">{m.cheapest.name}</strong>
              <span className="rung-price">from {shortUnitPrice(m.cheapest.unit_price_millipaise, m.cheapest.pack_unit)}</span>
            </div>
            <div className="rung-tags">
              <SourceBadge source={m.cheapest.source} />
              {m.differences.map((d) => (
                <span key={d} className="badge badge-diff">
                  {d}
                </span>
              ))}
            </div>
            <span className="small muted">{m.salts_label}</span>
            <Link className="link-chip close-link" href={`/compare?key=${encodeURIComponent(m.key)}`}>
              See {m.offers} {m.offers === 1 ? "price" : "prices"} →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
