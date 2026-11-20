"use client";

import { useEffect, useState } from "react";
import type { Comparison } from "@/api/client";
import { useAuth } from "@/features/auth/AuthProvider";
import { SourceBadge } from "@/features/search/SourceBadge";
import { packLabel, percent, rupees, unitPriceLabel } from "@/lib/format";
import { compareMatch } from "@/services/catalog";
import { MedicineCard } from "./MedicineCard";
import { SaveButton } from "./SaveButton";

type State =
  | { kind: "loading" }
  | { kind: "done"; data: Comparison }
  | { kind: "error"; message: string };

type Props = { matchKey: string; searched?: string; headingLevel?: "h1" | "h2" };

/** Every exact substitute for one match key, cheapest first, with the saving and buy links. */
export function CompareView({ matchKey, searched, headingLevel = "h1" }: Props) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const { user } = useAuth();

  useEffect(() => {
    let live = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for a new key
    setState({ kind: "loading" });
    compareMatch(matchKey, searched).then((r) => {
      if (!live) return;
      setState(r.ok ? { kind: "done", data: r.data } : { kind: "error", message: r.message });
    });
    return () => {
      live = false;
    };
  }, [matchKey, searched]);

  if (state.kind === "loading") return <p aria-busy="true">Finding substitutes…</p>;
  if (state.kind === "error") {
    return (
      <p role="alert" className="notice notice-error">
        {state.message}
      </p>
    );
  }

  const c = state.data;
  const cheapest = c.offers[0]?.offer;
  const base = c.searched_index != null ? c.offers[c.searched_index]?.offer : undefined;
  const ja = c.offers.find((o) => o.offer.source === "jan_aushadhi")?.offer;
  const maxUnit = Math.max(...c.offers.map((o) => o.offer.unit_price_millipaise), 1);
  const picked = base ?? cheapest;
  const Sub = headingLevel === "h1" ? "h2" : "h3";

  return (
    <div className="stack-lg compare">
      {picked && <MedicineCard offer={picked} matchKey={c.key} headingLevel={headingLevel} />}
      <section className="stack">
        <Sub className="h3">Same medicine, other prices</Sub>
        <dl className="stats">
          {base && (
            <div className="stat">
              <dt>You searched</dt>
              <dd className="stat-price">{rupees(base.unit_price_millipaise / 1000)}</dd>
              <dd className="stat-name">{base.name}</dd>
            </div>
          )}
          {cheapest && (
            <div className="stat stat-best">
              <dt>Cheapest</dt>
              <dd className="stat-price">{rupees(cheapest.unit_price_millipaise / 1000)}</dd>
              <dd className="stat-name">{cheapest.name}</dd>
            </div>
          )}
          {ja && (
            <div className="stat">
              <dt>Jan Aushadhi</dt>
              <dd className="stat-price">{rupees(ja.unit_price_millipaise / 1000)}</dd>
              <dd className="stat-name">At any Kendra</dd>
            </div>
          )}
        </dl>
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

      <ol className="ladder plain" aria-label="Substitutes, cheapest first">
        {c.offers.map(({ offer, links }, i) => {
          const you = i === c.searched_index;
          const tone = you ? " bar-you" : i === 0 || offer.source === "jan_aushadhi" ? " bar-good" : "";
          return (
            <li key={offer.id} className={`rung${you ? " rung-you" : i === 0 ? " rung-best" : ""}`}>
              <div className="rung-top">
                <strong className="rung-title">{offer.name}</strong>
                <span className="rung-price">{unitPriceLabel(offer.unit_price_millipaise, offer.pack_unit)}</span>
              </div>
              <div className="rung-tags">
                <SourceBadge source={offer.source} />
                {i === 0 && <span className="badge badge-cheapest">Cheapest</span>}
                {you && <span className="badge badge-searched">You searched</span>}
                <span className="muted small rung-meta">
                  {offer.manufacturer} · {rupees(offer.price_paise)} for {packLabel(offer.pack_count, offer.pack_unit)}
                </span>
              </div>
              <div className="rung-bar" aria-hidden="true">
                <span
                  className={`bar${tone}`}
                  style={{ width: `${Math.max(2, (offer.unit_price_millipaise / maxUnit) * 100)}%` }}
                />
              </div>
              {links.length > 0 && (
                <div className="rung-links">
                  {links.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="link-chip">
                      {l.label} ↗
                    </a>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <p className="small muted disclaimer">
        Prices are maximum retail prices from public lists and may differ at the shop. Nirog compares
        prices only and is not medical advice. Ask your doctor or pharmacist before switching.
      </p>
    </div>
  );
}
