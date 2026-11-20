"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Comparison } from "@/api/client";
import { useAuth } from "@/features/auth/AuthProvider";
import { SourceBadge } from "@/features/search/OfferSummary";
import { packLabel, percent, rupees, unitPriceLabel } from "@/lib/format";
import { compareMatch } from "@/services/catalog";
import { SaveButton } from "./SaveButton";

type State =
  | { kind: "loading" }
  | { kind: "done"; data: Comparison }
  | { kind: "error"; message: string };

export function ComparePage() {
  const params = useSearchParams();
  const key = params.get("key") ?? "";
  const searched = params.get("searched") ?? undefined;
  const [state, setState] = useState<State>({ kind: "loading" });
  const { user } = useAuth();

  useEffect(() => {
    let live = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for a new key
    setState({ kind: "loading" });
    compareMatch(key, searched).then((r) => {
      if (!live) return;
      setState(r.ok ? { kind: "done", data: r.data } : { kind: "error", message: r.message });
    });
    return () => {
      live = false;
    };
  }, [key, searched]);

  if (state.kind === "loading") return <p aria-busy="true">Finding substitutes…</p>;
  if (state.kind === "error") {
    return (
      <div className="stack">
        <p role="alert" className="notice notice-error">
          {state.message}
        </p>
        <Link href="/">Back to search</Link>
      </div>
    );
  }

  const c = state.data;
  const cheapest = c.offers[0]?.offer;
  const base = c.searched_index != null ? c.offers[c.searched_index]?.offer : undefined;

  return (
    <div className="stack-lg">
      <section className="stack">
        <p className="small">
          <Link href="/">← Search</Link>
        </p>
        <h1 className="h2">{cheapest?.salts_label}</h1>
        {c.saving_per_pack_paise > 0 && cheapest && (
          <p className="saving" role="status">
            Save up to <strong>{rupees(c.saving_per_pack_paise)}</strong> per pack (
            {percent(c.saving_bps)}){base ? <> compared with {base.name}</> : null} by choosing{" "}
            <strong>{cheapest.name}</strong>.
          </p>
        )}
        {c.saving_per_pack_paise <= 0 && base && (
          <p className="notice">{base.name} is already the cheapest exact match we know of.</p>
        )}
        <p className="small muted">
          Showing {c.offers.length} of {c.total_offers} exact substitute
          {c.total_offers === 1 ? "" : "s"}, cheapest first by price per unit. Same salts, strength,
          form and release type.
        </p>
        {user && <SaveButton matchKey={c.key} offerId={base?.id} defaultLabel={base?.name ?? cheapest?.name ?? ""} />}
      </section>

      <ol className="cards" aria-label="Substitutes, cheapest first">
        {c.offers.map(({ offer, links }, i) => (
          <li key={offer.id} className={`card stack-sm${i === c.searched_index ? " card-searched" : ""}`}>
            <div className="offer-name">
              <strong>{offer.name}</strong> <SourceBadge source={offer.source} />
              {i === 0 && <span className="badge badge-cheapest">Cheapest</span>}
              {i === c.searched_index && <span className="badge badge-searched">You searched</span>}
            </div>
            <div className="muted small">{offer.manufacturer}</div>
            <div className="price-row">
              <span className="price">{unitPriceLabel(offer.unit_price_millipaise, offer.pack_unit)}</span>
              <span className="muted small">
                {rupees(offer.price_paise)} for {packLabel(offer.pack_count, offer.pack_unit)}
              </span>
            </div>
            {links.length > 0 && (
              <div className="links">
                {links.map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="button button-quiet">
                    {l.label} ↗
                  </a>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>

      <p className="small muted disclaimer">
        Prices are maximum retail prices from public lists and may differ at the shop. Nirog compares
        prices only and is not medical advice. Ask your doctor or pharmacist before switching.
      </p>
    </div>
  );
}
