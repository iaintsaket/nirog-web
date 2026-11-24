import type { Metadata } from "next";
import { AboutCarousel } from "@/features/about/AboutCarousel";
import { aboutJsonLd, jsonLd, pageMeta } from "@/lib/site";

const title = "About Nirog: compare medicine prices and generic substitutes in India";
const description =
  "Nirog compares prices of the same medicine across brands and Jan Aushadhi, with exact substitutes matched by salt, strength and form. Free, no ads, no trackers.";

export const metadata: Metadata = pageMeta({ path: "/about", title, description });

export default function About() {
  return (
    <div className="about-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(aboutJsonLd()) }} />
      <header className="about-head">
        <h1>About Nirog</h1>
        <p className="lede muted">A simple, fair way to compare what health costs.</p>
      </header>
      <AboutCarousel />
      <section className="about-more" aria-labelledby="about-more-h">
        <h2 id="about-more-h">How Nirog works</h2>
        <p>
          Search for a medicine by its brand or salt name. Nirog lists exact substitutes, with the same salts, strength and
          form, from Jan Aushadhi (Pradhan Mantri Bhartiya Janaushadhi Pariyojana) and other makers, and shows their
          prices side by side, so you can ask your chemist for the one that costs less.
        </p>
        <p>
          Prices come from public price lists. Nirog is free to use, shows no ads and takes no money from drug makers.
        </p>
      </section>
    </div>
  );
}
