"use client";

import { Fragment, type CSSProperties, type ReactNode } from "react";
import type { BuyLink, Offer } from "@/api/client";
import { SourceBadge } from "@/features/search/SourceBadge";
import { packLabel, rupees, shortUnitPrice, unitPriceLabel } from "@/lib/format";
import { useCompare } from "./CompareContext";

type Props = {
  offer: Offer;
  links?: BuyLink[];
  /** Place in the entrance line-up. */
  order: number;
  tone?: "best" | "you";
  /** Extra tags after the source badge (Cheapest, Save ₹X, what differs…). */
  tags?: ReactNode;
  /** Price bar width in percent, and its colour. */
  bar?: { width: number; tone: "" | " bar-good" | " bar-you" };
  pricePrefix?: string;
  /** Anything else at the bottom of the card, e.g. a link to more prices. */
  footer?: ReactNode;
};

/** Names like "A+B+C" have no spaces: allow a line break after each "+" instead of mid-word. */
function breakable(name: string): ReactNode {
  const parts = name.split("+");
  return parts.map((p, i) => (
    <Fragment key={i}>
      {p}
      {i < parts.length - 1 && (
        <>
          +<wbr />
        </>
      )}
    </Fragment>
  ));
}

/**
 * The one medicine card used in every list. Inside a CompareProvider, clicking anywhere on it
 * compares it with your medicine, and "+ Compare" adds it to the compare tray.
 */
export function MedicineTile({ offer, links = [], order, tone, tags, bar, pricePrefix = "", footer }: Props) {
  const compare = useCompare();
  const canCompare = compare != null && offer.id !== compare.mine.id;
  const item = { offer, links };
  const added = canCompare && compare.added(offer.id);
  return (
    <li
      className={`rung card-in${tone === "you" ? " rung-you" : tone === "best" ? " rung-best" : ""}${canCompare ? " rung-clickable" : ""}`}
      style={{ "--i": order } as CSSProperties}
      onClick={(e) => {
        // The whole card opens the comparison; its links and buttons keep their own jobs.
        if (canCompare && !(e.target as HTMLElement).closest("a, button")) compare.show([item]);
      }}
    >
      <div className="rung-top">
        {canCompare ? (
          <button
            type="button"
            className="rung-open"
            aria-label={`Compare ${offer.name} with ${compare.mine.name}`}
            onClick={() => compare.show([item])}
          >
            <strong className="rung-title">{breakable(offer.name)}</strong>
          </button>
        ) : (
          <strong className="rung-title">{breakable(offer.name)}</strong>
        )}
        <span className="rung-price" title={unitPriceLabel(offer.unit_price_millipaise, offer.pack_unit)}>
          {pricePrefix}
          {shortUnitPrice(offer.unit_price_millipaise, offer.pack_unit)}
        </span>
      </div>
      <div className="rung-tags">
        <SourceBadge source={offer.source} />
        {tags}
        <span className="muted small rung-meta">
          {offer.manufacturer} · {rupees(offer.price_paise)} for {packLabel(offer.pack_count, offer.pack_unit)}
        </span>
      </div>
      {bar && (
        <div className="rung-bar" aria-hidden="true">
          <span className={`bar${bar.tone}`} style={{ width: `${Math.max(2, bar.width)}%` }} />
        </div>
      )}
      {canCompare && (
        <button
          type="button"
          className="add-compare"
          aria-pressed={added}
          aria-label={`Add ${offer.name} to compare`}
          disabled={!added && compare.full}
          onClick={() => compare.toggle(item)}
        >
          {added ? "✓ Added" : "+ Compare"}
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
      {footer}
    </li>
  );
}
