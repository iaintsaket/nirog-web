"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SIGN_IN_URL } from "@/services/account";
import { useAuth } from "./AuthProvider";
import { AccountsComingSoon, signInEnabled } from "./signInFlag";

export function SignInPage() {
  const params = useSearchParams();
  const { user } = useAuth();
  const failed = params.get("error") !== null;
  if (!signInEnabled()) return <AccountsComingSoon title="Sign in" />;

  return (
    <section className="narrow stack">
      <h1>Sign in</h1>
      <p className="muted">
        Sign in to save medicines you compare often. Searching and comparing work without an account.
      </p>
      {failed && (
        <p role="alert" className="notice notice-error">
          Sign-in did not complete. Please try again.
        </p>
      )}
      {user ? (
        <p>
          You are signed in as <strong>{user.email}</strong>. <Link href="/saved">Go to saved</Link>
        </p>
      ) : (
        <a className="button button-primary" href={SIGN_IN_URL}>
          Continue with Google
        </a>
      )}
      <p className="small muted">
        We store only your name, email and the matches you save. See the{" "}
        <Link href="/privacy">privacy notice</Link>.
      </p>
    </section>
  );
}
