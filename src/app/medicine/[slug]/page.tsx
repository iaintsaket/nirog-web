import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComparisonView } from "@/features/compare/CompareView";
import { asOf, description, heading, letterLabel, letterOf, liveHref, medicineJsonLd, title } from "@/lib/medicines";
import { medicines } from "@/lib/medicines-data";
import { jsonLd } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

/** One static page per medicine with a substitute, built at deploy from the API. */
export const dynamicParams = false;

export function generateStaticParams() {
  return medicines().entries.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const entry = medicines().bySlug.get((await params).slug);
  if (!entry) return {};
  const t = title(entry.page);
  const d = description(entry.page, medicines().updatedOn);
  const url = `/medicine/${entry.slug}`;
  return {
    title: t,
    description: d,
    alternates: { canonical: url },
    openGraph: { title: t, description: d, url },
    twitter: { title: t, description: d },
  };
}

export default async function Medicine({ params }: Params) {
  const entry = medicines().bySlug.get((await params).slug);
  if (!entry) notFound();
  const { page, slug } = entry;
  const c = page.comparison;
  const date = asOf(medicines().updatedOn);
  const letter = letterOf(slug);
  return (
    <div className="stack-lg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(medicineJsonLd(entry)) }} />
      <div className="stack">
        <p className="small">
          <Link href="/">← Search</Link> · <a href={`/medicines/${letter}`}>Medicines: {letterLabel(letter)}</a>
        </p>
        <h1>{heading(page)}</h1>
        <p className="lede">
          {c.total_offers} medicines with the same salts, strength and form, cheapest first.
          {date && <> Prices as of {date}.</>}
        </p>
      </div>
      <ComparisonView c={c} headingLevel="h2" live={false} />
      {c.total_offers > c.offers.length && (
        <p className="small">
          <a href={liveHref(c.key)}>See all {c.total_offers} with today&apos;s prices →</a>
        </p>
      )}
      <section className="stack-sm">
        <h2 className="h3">Sold under these names</h2>
        <details>
          <summary className="small">All {page.names.length} names</summary>
          <p className="small muted">{page.names.join(", ")}</p>
        </details>
      </section>
    </div>
  );
}
