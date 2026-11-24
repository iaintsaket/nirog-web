import Link from "next/link";

/** "About" beside the logo: straight to the cards on /about. */
export function AboutLink() {
  return (
    <Link href="/about" className="about-link-nav">
      About
    </Link>
  );
}
