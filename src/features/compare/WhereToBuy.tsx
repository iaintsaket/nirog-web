import { useId } from "react";
import { rupees } from "@/lib/format";
import { checkedLabel, recommend, sortRows, type StockStatus, type VendorRow } from "./vendors";

const PILL: Record<StockStatus, { icon: string; text: string }> = {
  in_stock: { icon: "✓", text: "In stock" },
  out_of_stock: { icon: "✕", text: "Out of stock" },
  unknown: { icon: "?", text: "Not checked yet" },
};

type Props = {
  rows: VendorRow[];
  /** The medicine these rows are for, shown when the window lists several. */
  name?: string;
  /** Jan Aushadhi medicines are sold only in Kendras: rows find a store instead of buying online. */
  janAushadhi?: boolean;
};

/** A clear "Where to buy" section: one row per pharmacy (generic name, stock, price), best option marked, out of stock last. */
export function WhereToBuy({ rows, name, janAushadhi = false }: Props) {
  const titleId = useId();
  if (rows.length === 0) return null;
  const sorted = sortRows(rows);
  const best = recommend(rows);
  return (
    <section className="wtb" aria-labelledby={titleId}>
      <div className="wtb-head">
        <h3 id={titleId} className="h3">
          Where to buy{name && <> <span className="wtb-for">for {name}</span></>}
        </h3>
        {janAushadhi && <p className="small wtb-note">Sold only at Jan Aushadhi Kendras, not online.</p>}
      </div>
      <ul className="plain wtb-list">
        {sorted.map((r) => {
          const online = r.kind === "online";
          const isBest = r === best;
          const checked = r.checkedAt ? checkedLabel(r.checkedAt) : undefined;
          return (
            <li key={`${r.kind}|${r.vendor}`} className={`wtb-row wtb-${r.status}${isBest ? " wtb-best" : ""}`}>
              <div className="wtb-info">
                <div className="wtb-name">
                  <strong>{r.label}</strong>
                  {isBest && <span className="badge badge-cheapest">★ Best option</span>}
                </div>
                <div className="wtb-meta small">
                  {online ? (
                    <span className={`wtb-pill wtb-pill-${r.status}`}>
                      <span aria-hidden="true">{PILL[r.status].icon}</span> {PILL[r.status].text}
                    </span>
                  ) : (
                    <span className="muted">Store finder</span>
                  )}
                  {r.pricePaise != null && <span className="wtb-price">{rupees(r.pricePaise)}</span>}
                  {checked && <span className="muted">{checked}</span>}
                </div>
              </div>
              {r.kind === "store" && r.url && (
                <a className="button wtb-buy button-primary" href={r.url} target="_blank" rel="noopener noreferrer nofollow">
                  {r.label} <span aria-hidden="true">↗</span>
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              )}
            </li>
          );
        })}
      </ul>
      {!janAushadhi && <p className="small muted wtb-foot">Nirog does not sell medicines. Prices and stock at each shop may differ.</p>}
    </section>
  );
}
