import { useId } from "react";
import type { Offer } from "@/api/client";
import { SourceBadge } from "@/features/search/SourceBadge";
import { formLabel, packLabel, rupees, unitPriceLabel } from "@/lib/format";

type Props = { offer: Offer; matchKey: string; headingLevel: "h1" | "h2" };

/** The picked medicine's details: what is in it, its form, pack and price. */
export function MedicineCard({ offer, matchKey, headingLevel: Heading }: Props) {
  const id = useId();
  const form = formLabel(matchKey);
  const facts: [string, string | undefined][] = [
    ["Composition", offer.salts_label],
    ["Form", form],
    ["Pack", packLabel(offer.pack_count, offer.pack_unit)],
    ["Price", `${rupees(offer.price_paise)} per pack`],
    ["Per unit", unitPriceLabel(offer.unit_price_millipaise, offer.pack_unit)],
    ["Maker", offer.manufacturer],
  ];
  return (
    <section className="med-card" aria-labelledby={id}>
      <div className="med-card-head">
        <Heading id={id} className="h2">
          {offer.name}
        </Heading>
        <SourceBadge source={offer.source} />
      </div>
      <dl className="med-facts">
        {facts
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className={k === "Composition" ? "med-fact med-fact-wide" : "med-fact"}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
      </dl>
    </section>
  );
}
