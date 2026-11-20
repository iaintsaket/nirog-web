"use client";

import { useEffect, useId, useRef } from "react";
import type { BuyLink, Offer } from "@/api/client";
import { packLabel, percent, rupees, sourceLabel, unitPriceLabel } from "@/lib/format";

type Other = { offer: Offer; links: BuyLink[] };
type Props = { mine: Offer; others: Other[]; form?: string; onClose: () => void };

/** Rows of the comparison. `same` marks a value that matches your medicine. Add a row by adding an entry. */
const ROWS: { label: string; value: (o: Offer, form?: string) => string | undefined; same?: boolean }[] = [
  { label: "Made by", value: (o) => o.manufacturer },
  { label: "Type", value: (o) => sourceLabel(o.source) },
  { label: "Composition", value: (o) => o.salts_label, same: true },
  { label: "Form", value: (_o, form) => form, same: true },
  { label: "Pack", value: (o) => packLabel(o.pack_count, o.pack_unit) },
  { label: "Price per pack", value: (o) => rupees(o.price_paise) },
  { label: "Per unit", value: (o) => unitPriceLabel(o.unit_price_millipaise, o.pack_unit) },
];

/** What switching from `mine` to `o` saves on a pack the size of yours (negative: costs more). */
function saving(mine: Offer, o: Offer): { paise: number; bps: number } {
  const paise = ((mine.unit_price_millipaise - o.unit_price_millipaise) * mine.pack_count) / 1000;
  return { paise, bps: Math.round((paise / mine.price_paise) * 10000) };
}

/** Your medicine side by side with up to three alternatives. */
export function CompareDialog({ mine, others, form, onClose }: Props) {
  const titleId = useId();
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const cols = [mine, ...others.map((o) => o.offer)];
  const rows = ROWS.filter((r) => r.value(mine, form) !== undefined);
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog card-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <h2 id={titleId} className="h3">
            {cols.map((o) => o.name).join(" vs ")}
          </h2>
          <button ref={close} type="button" className="dialog-close" aria-label="Close comparison" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="dialog-scroll">
          <table className="compare-table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="visually-hidden">Detail</span>
                </th>
                {cols.map((o, i) => (
                  <th key={o.id} scope="col" className={i === 0 ? "col-mine" : undefined}>
                    {i === 0 && <span className="badge badge-searched">Yours</span>} {o.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  {cols.map((o, i) => {
                    const v = r.value(o, form) ?? "—";
                    const same = r.same && i > 0 && v === r.value(mine, form);
                    return (
                      <td key={o.id} className={i === 0 ? "col-mine" : undefined}>
                        {v}
                        {same && <span className="same"> ✓ Same</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="plain stack-sm compare-savings">
          {others.map(({ offer }) => {
            const s = saving(mine, offer);
            return (
              <li key={offer.id} className={s.paise > 0 ? "save-yes" : "save-no"}>
                {s.paise > 0 ? (
                  <>
                    You save <strong>{rupees(s.paise)}</strong> per pack ({percent(s.bps)}) with {offer.name}.
                  </>
                ) : (
                  <>
                    {offer.name} costs {rupees(-s.paise)} more per pack.
                  </>
                )}
              </li>
            );
          })}
        </ul>
        {others.some((o) => o.links.length > 0) && (
          <div className="stack-sm">
            {others
              .filter((o) => o.links.length > 0)
              .map(({ offer, links }) => (
                <div key={offer.id} className="rung-links">
                  {others.length > 1 && <span className="small muted">{offer.name}:</span>}
                  {links.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="link-chip">
                      {l.label} ↗
                    </a>
                  ))}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
