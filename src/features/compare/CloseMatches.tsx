"use client";

import Link from "next/link";
import { useId } from "react";
import { compareHref } from "@/lib/medicines";
import { closeMatches } from "@/services/catalog";
import { useResult } from "@/services/useResult";
import { MedicineTile } from "./MedicineTile";

/** Nearby formulas for a medicine with no cheaper exact substitute, each saying what differs. */
export function CloseMatches({ matchKey }: { matchKey: string }) {
  const r = useResult(() => closeMatches(matchKey), [matchKey]);
  const titleId = useId();
  const matches = r?.ok ? r.data : [];
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
                <Link className="link-chip close-link" href={compareHref(m.key)}>
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
