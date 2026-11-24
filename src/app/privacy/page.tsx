import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What personal data Nirog processes, why, and how to delete it, under India's Digital Personal Data Protection Act, 2023.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <article className="narrow stack prose">
      <h1>Privacy notice</h1>
      <p className="muted small">Last updated 20 November 2026</p>
      <p>
        Nirog helps you compare medicine prices. This notice explains what personal data we process
        under India&apos;s Digital Personal Data Protection Act, 2023.
      </p>
      <h2 className="h3">Without an account</h2>
      <p>
        Searching and comparing need no account. We do not use advertising or analytics trackers.
        Your IP address is used briefly to rate-limit requests and is not stored.
      </p>
      <h2 className="h3">With an account</h2>
      <p>
        When you sign in with Google we receive and store your name and verified email address. We
        also store the medicines you choose to save and a hashed session token that keeps you signed
        in for up to 30 days. We use this data only to show you your saved medicines.
      </p>
      <h2 className="h3">Your rights</h2>
      <p>
        You can delete your account at any time from the Saved page. This erases your name, email,
        sessions and saved medicines immediately. For any other request or grievance, open an issue
        at{" "}
        <a href="https://github.com/iaintsaket/nirog-web/issues" rel="noopener noreferrer">
          github.com/iaintsaket/nirog-web
        </a>
        .
      </p>
      <h2 className="h3">Where data is kept</h2>
      <p>
        The API runs on Google Cloud in Mumbai and the database on Neon. Data is encrypted in transit
        and at rest. We never sell or share your data.
      </p>
      <h2 className="h3">Medical disclaimer</h2>
      <p>
        Nirog compares prices from public lists. It is not medical advice. Always ask your doctor or
        pharmacist before switching medicines.
      </p>
    </article>
  );
}
