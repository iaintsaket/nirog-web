import type { Offer } from "@/api/client";
import { packLabel, rupees, sourceLabel, unitPriceLabel } from "@/lib/format";

export function SourceBadge({ source }: { source: Offer["source"] }) {
  return <span className={`badge badge-${source}`}>{sourceLabel(source)}</span>;
}

export function OfferSummary({ offer }: { offer: Offer }) {
  return (
    <div className="offer-summary">
      <div className="offer-name">
        <strong>{offer.name}</strong> <SourceBadge source={offer.source} />
      </div>
      <div className="muted small">{offer.manufacturer}</div>
      <div className="small">
        {rupees(offer.price_paise)} for {packLabel(offer.pack_count, offer.pack_unit)} ·{" "}
        {unitPriceLabel(offer.unit_price_millipaise, offer.pack_unit)}
      </div>
    </div>
  );
}
