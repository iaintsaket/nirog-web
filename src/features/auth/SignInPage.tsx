"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { SIGN_IN_URL } from "@/services/account";
import { Pulse } from "@/ui/Pulse";
import { useAuth } from "./AuthProvider";
import { AccountsComingSoon, signInEnabled } from "./signInFlag";

/** Google's four-colour "G", as its sign-in branding guidelines require. */
function GoogleMark() {
  return (
    <svg
      className="provider-mark"
      viewBox="0 0 48 48"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/** Ways to sign in. A new provider is one more entry here. */
const PROVIDERS: {
  id: string;
  label: string;
  href: string;
  mark: ReactNode;
}[] = [
  {
    id: "google",
    label: "Continue with Google",
    href: SIGN_IN_URL,
    mark: <GoogleMark />,
  },
];

/** What an account adds. Only features that exist today. */
const PERKS: { title: string; text: string; icon: ReactNode }[] = [
  {
    title: "Save what you buy often",
    text: "Keep the medicines you compare, and come back to today's prices in one tap.",
    icon: <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" />,
  },
  {
    title: "Same list on every device",
    text: "Your saved medicines follow you from phone to laptop.",
    icon: (
      <>
        <rect x="3" y="5" width="13" height="10" rx="1.5" />
        <rect x="16" y="9" width="5" height="10" rx="1.2" />
        <path d="M6 19h7" />
      </>
    ),
  },
  {
    title: "No new password",
    text: "Google confirms it's you. We never see your password, and we store only your name and email.",
    icon: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
  },
];

export function SignInPage() {
  const params = useSearchParams();
  const { user } = useAuth();
  const failed = params.get("error") !== null;
  if (!signInEnabled()) return <AccountsComingSoon title="Sign in" />;

  return (
    <div className="auth-page">
      <section className="auth-pitch" aria-labelledby="auth-pitch-title">
        <p className="auth-kicker">Free account</p>
        <h2 id="auth-pitch-title">Your medicines, one tap away</h2>
        <p className="muted">
          Searching and comparing prices always work without an account.
        </p>
        <ul className="perks">
          {PERKS.map((p) => (
            <li key={p.title}>
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                aria-hidden="true"
                className="perk-icon"
              >
                {p.icon}
              </svg>
              <div>
                <strong>{p.title}</strong>
                <p className="muted small">{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="auth-card">
        <div className="auth-head">
          <Pulse size="md" />
          <h1>{user ? "You're signed in" : "Sign in to Nirog"}</h1>
          <p className="muted">
            {user ? (
              <>
                as <strong>{user.email}</strong>
              </>
            ) : (
              "Pick how you'd like to continue."
            )}
          </p>
        </div>
        {failed && (
          <p role="alert" className="notice notice-error">
            Sign-in did not complete. Please try again.
          </p>
        )}
        {user ? (
          <Link className="button button-primary auth-wide" href="/saved">
            Go to saved
          </Link>
        ) : (
          <ul className="providers" aria-label="Sign-in options">
            {PROVIDERS.map((p) => (
              <li key={p.id}>
                <a className={`provider provider-${p.id}`} href={p.href}>
                  {p.mark}
                  <span>{p.label}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="small muted auth-foot">
          We store only your name, email and the matches you save.{" "}
          <Link href="/privacy">Privacy notice</Link>
        </p>
      </section>
    </div>
  );
}
