import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import { notFound } from "next/navigation";
import { heading, letterLabel, letterOf } from "@/lib/medicines";
import { letters, medicines } from "@/lib/medicines-data";

type Params = { params: Promise<{ letter: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return letters().map((letter) => ({ letter }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const l = letterLabel((await params).letter);
  return pageMeta({ path: `/medicines/${(await params).letter}`, title: `Medicines: ${l}`, description: `Medicines starting with ${l} that have exact substitutes, from Jan Aushadhi and other brands.` });
}

/** A–Z index: every medicine page is two clicks from the footer, for people and crawlers. */
export default async function MedicinesByLetter({ params }: Params) {
  const { letter } = await params;
  const all = letters();
  if (!all.includes(letter)) notFound();
  const here = medicines().entries.filter((e) => letterOf(e.slug) === letter);
  return (
    <div className="stack-lg">
      <div className="stack">
        <h1>Medicines: {letterLabel(letter)}</h1>
        <nav aria-label="Medicines A to Z">
          <ul className="suggestions plain">
            {all.map((l) => (
              <li key={l}>
                <a className="chip" href={`/medicines/${l}`} aria-current={l === letter ? "page" : undefined}>
                  {letterLabel(l)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <ul className="plain stack-sm">
        {here.map(({ slug, page }) => (
          <li key={slug}>
            <a href={`/medicine/${slug}`}>{heading(page)}</a>{" "}
            <span className="small muted">· {page.comparison.total_offers} options</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
