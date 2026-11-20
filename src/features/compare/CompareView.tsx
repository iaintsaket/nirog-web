"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { Comparison, Offer } from "@/api/client";
import { useAuth } from "@/features/auth/AuthProvider";
import { SourceBadge } from "@/features/search/SourceBadge";
import { formLabel, packLabel, percent, rupees, shortUnitPrice, unitPriceLabel } from "@/lib/format";
import { compareMatch } from "@/services/catalog";
import { CompareDialog } from "./CompareDialog";
import { MedicineCard } from "./MedicineCard";
import { SaveButton } from "./SaveButton";
import { Loading } from "@/ui/Pulse";

type State =
  | { kind: "loading" }
  | { kind: "done"; data: Comparison }
  | { kind: "error"; message: string };

/** At most this many alternatives can be added to one comparison. */
const MAX_COMPARE = 3;

/** Place in the entrance line-up: cards land one after another. */
const order = (i: number) => ({ "--i": i }) as CSSProperties;

type Row = { offer: Offer; index: number };

/**
 * A summary box that doubles as a quick filter on the list below. Add a filter by adding an entry.
 * `pick` chooses the offer the box shows (no offer → no box); `keep` decides which rows stay.
 */
type QuickFilter = {
  id: string;
  label: string;
  /** Completes "Showing only …" while the filter is on. */
  shows: string;
  pick: (c: Comparison) => Offer | undefined;
  note: (o: Offer) => string;
  keep: (row: Row, c: Comparison, picked: Offer) => boolean;
  best?: boolean;
  /** Also offered as a chip beside the Alternatives heading, with this label. */
  chip?: string;
  /** false: chip only, no summary box. */
  box?: boolean;
};

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: "searched",
    label: "You searched",
    shows: "the medicine you searched",
    pick: (c) => (c.searched_index != null ? c.offers[c.searched_index]?.offer : undefined),
    note: (o) => o.name,
    keep: (r, c) => r.index === c.searched_index,
  },
  {
    id: "cheapest",
    label: "Cheapest",
    shows: "the cheapest",
    pick: (c) => c.offers[0]?.offer,
    note: (o) => o.name,
    keep: (r, _c, p) => r.offer.unit_price_millipaise === p.unit_price_millipaise,
    best: true,
  },
  {
    id: "jan_aushadhi",
    label: "Jan Aushadhi",
    shows: "Jan Aushadhi medicines",
    pick: (c) => c.offers.find((o) => o.offer.source === "jan_aushadhi")?.offer,
    note: () => "At any Kendra",
    keep: (r) => r.offer.source === "jan_aushadhi",
    chip: "Jan Aushadhi",
  },
  {
    id: "brand",
    label: "Brands",
    shows: "brands",
    pick: (c) => c.offers.find((o) => o.offer.source === "brand")?.offer,
    note: (o) => o.name,
    keep: (r) => r.offer.source === "brand",
    chip: "Brands",
    box: false,
  },
];

type Props = { matchKey: string; searched?: string; headingLevel?: "h1" | "h2" };

/** Every exact substitute for one match key, cheapest first, with the saving and buy links. */
export function CompareView({ matchKey, searched, headingLevel = "h1" }: Props) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [filter, setFilter] = useState<string | null>(null);
  const [dearestFirst, setDearestFirst] = useState(false);
  /** Alternatives added to compare (offer ids), and the ones shown in the open comparison. */
  const [picks, setPicks] = useState<string[]>([]);
  const [open, setOpen] = useState<string[] | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let live = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for a new key
    setState({ kind: "loading" });
    setFilter(null);
    setPicks([]);
    setOpen(null);
    compareMatch(matchKey, searched).then((r) => {
      if (!live) return;
      setState(r.ok ? { kind: "done", data: r.data } : { kind: "error", message: r.message });
    });
    return () => {
      live = false;
    };
  }, [matchKey, searched]);

  if (state.kind === "loading") return <Loading>Finding cheaper substitutes…</Loading>;
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
  const available = QUICK_FILTERS.flatMap((f) => {
    const offer = f.pick(c);
    return offer ? [{ f, offer }] : [];
  });
  const boxes = available.filter((b) => b.f.box !== false);
  const chips = available.filter((b) => b.f.chip);
  const active = available.find((b) => b.f.id === filter);
  const kept = c.offers
    .map(({ offer, links }, index) => ({ offer, links, index }))
    .filter((r) => !active || active.f.keep(r, c, active.offer));
  const rows = dearestFirst ? [...kept].reverse() : kept;
  const maxUnit = Math.max(...c.offers.map((o) => o.offer.unit_price_millipaise), 1);
  const picked = base ?? cheapest;
  const Sub = headingLevel === "h1" ? "h2" : "h3";

  return (
    <div className="stack-lg compare">
      {picked && <MedicineCard offer={picked} matchKey={c.key} headingLevel={headingLevel} />}
      <section className="stack">
        <div className="alt-head">
          <Sub className="h2">Alternatives</Sub>
          <div className="alt-tools">
            <div className="chips" role="group" aria-label="Show">
              <button type="button" className="chip-toggle" aria-pressed={filter === null} onClick={() => setFilter(null)}>
                All
              </button>
              {chips.map(({ f }) => (
                <button
                  key={f.id}
                  type="button"
                  className="chip-toggle"
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter((cur) => (cur === f.id ? null : f.id))}
                >
                  {f.chip}
                </button>
              ))}
            </div>
            <label className="sort">
              <span className="visually-hidden">Sort</span>
              <select aria-label="Sort" value={dearestFirst ? "desc" : "asc"} onChange={(e) => setDearestFirst(e.target.value === "desc")}>
                <option value="asc">Price: low to high</option>
                <option value="desc">Price: high to low</option>
              </select>
            </label>
          </div>
        </div>
        <div className="stats" role="group" aria-label="Quick filters">
          {boxes.map(({ f, offer }, n) => (
            <button
              key={f.id}
              type="button"
              className={`stat card-in${f.best ? " stat-best" : ""}`}
              style={order(1 + n)}
              aria-pressed={filter === f.id}
              onClick={() => setFilter((cur) => (cur === f.id ? null : f.id))}
            >
              <span className="stat-label">{f.label}</span>
              <span className="stat-price">{rupees(offer.unit_price_millipaise / 1000)}</span>
              <span className="stat-name">{f.note(offer)}</span>
            </button>
          ))}
        </div>
        {c.saving_per_pack_paise > 0 && cheapest && (
          <p className="saving card-in" role="status" style={order(4)}>
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
        {active && (
          <p className="small filter-note">
            Showing only {active.f.shows}
            ({rows.length}).{" "}
            <button type="button" className="link-button" onClick={() => setFilter(null)}>
              Show all {c.offers.length}
            </button>
          </p>
        )}
        {user && <SaveButton matchKey={c.key} offerId={base?.id} defaultLabel={base?.name ?? cheapest?.name ?? ""} />}
      </section>

      <ol className="ladder plain" aria-label="Substitutes, cheapest first">
        {rows.map(({ offer, links, index: i }, n) => {
          const you = i === c.searched_index;
          const tone = you ? " bar-you" : i === 0 || offer.source === "jan_aushadhi" ? " bar-good" : "";
          return (
            <li
              key={offer.id}
              className={`rung card-in${you ? " rung-you" : i === 0 ? " rung-best" : ""}`}
              style={order(5 + Math.min(n, 10))}
            >
              <div className="rung-top">
                {picked && offer.id !== picked.id ? (
                  <button
                    type="button"
                    className="rung-open"
                    aria-label={`Compare ${offer.name} with ${picked.name}`}
                    onClick={() => setOpen([offer.id])}
                  >
                    <strong className="rung-title">{offer.name}</strong>
                  </button>
                ) : (
                  <strong className="rung-title">{offer.name}</strong>
                )}
                <span className="rung-price" title={unitPriceLabel(offer.unit_price_millipaise, offer.pack_unit)}>
                  {shortUnitPrice(offer.unit_price_millipaise, offer.pack_unit)}
                </span>
              </div>
              <div className="rung-tags">
                <SourceBadge source={offer.source} />
                {i === 0 && <span className="badge badge-cheapest">Cheapest</span>}
                {you && <span className="badge badge-searched">You searched</span>}
                {base && offer.unit_price_millipaise < base.unit_price_millipaise && (
                  <span className="badge badge-save">
                    Save {rupees(((base.unit_price_millipaise - offer.unit_price_millipaise) * base.pack_count) / 1000)} per pack
                  </span>
                )}
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
              {picked && offer.id !== picked.id && (
                <button
                  type="button"
                  className="add-compare"
                  aria-pressed={picks.includes(offer.id)}
                  aria-label={`Add ${offer.name} to compare`}
                  disabled={!picks.includes(offer.id) && picks.length >= MAX_COMPARE}
                  onClick={() =>
                    setPicks((p) => (p.includes(offer.id) ? p.filter((x) => x !== offer.id) : [...p, offer.id]))
                  }
                >
                  {picks.includes(offer.id) ? "✓ Added" : "+ Compare"}
                </button>
              )}
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

      {picks.length > 0 && (
        <div className="compare-tray card-in" role="region" aria-label="Compare tray">
          <span className="small">
            {picks.length} of {MAX_COMPARE} added
          </span>
          <button type="button" className="button" onClick={() => setOpen(picks)}>
            Compare {picks.length + 1} medicines
          </button>
          <button type="button" className="link-button" onClick={() => setPicks([])}>
            Clear
          </button>
        </div>
      )}
      {open && picked && (
        <CompareDialog
          mine={picked}
          others={c.offers.filter((o) => open.includes(o.offer.id))}
          form={formLabel(c.key)}
          onClose={() => setOpen(null)}
        />
      )}

      <p className="small muted disclaimer">
        Prices are maximum retail prices from public lists and may differ at the shop. Nirog compares
        prices only and is not medical advice. Ask your doctor or pharmacist before switching.
      </p>
    </div>
  );
}
