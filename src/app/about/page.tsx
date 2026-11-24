import type { Metadata } from "next";
import { AboutCarousel } from "@/features/about/AboutCarousel";

export const metadata: Metadata = {
  title: "About",
  description: "Nirog helps anyone compare medicine prices and find exact substitutes. Health for everyone, everywhere.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <div className="about-page">
      <header className="about-head">
        <h1>About Nirog</h1>
        <p className="lede muted">A simple, fair way to compare what medicines cost.</p>
      </header>
      <AboutCarousel />
    </div>
  );
}
