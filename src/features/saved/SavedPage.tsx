"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SavedMatch } from "@/api/client";
import { useAuth } from "@/features/auth/AuthProvider";
import { AccountsComingSoon, signInEnabled } from "@/features/auth/signInFlag";
import { compareHref } from "@/features/search/SearchPage";
import { deleteAccount } from "@/services/account";
import { listSaved, removeSaved } from "@/services/saved";

type State = { kind: "loading" } | { kind: "done"; items: SavedMatch[] } | { kind: "error"; message: string };

export function SavedPage() {
  const { user, loading } = useAuth();
  if (!signInEnabled()) return <AccountsComingSoon title="Saved medicines" />;
  if (loading) return <p aria-busy="true">Loading…</p>;
  if (!user) {
    return (
      <section className="narrow stack">
        <h1>Saved medicines</h1>
        <p>
          <Link href="/signin">Sign in</Link> to save medicines and come back to their cheapest
          substitutes.
        </p>
      </section>
    );
  }
  return <SavedList />;
}

function SavedList() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let live = true;
    listSaved().then((r) => {
      if (live) setState(r.ok ? { kind: "done", items: r.data } : { kind: "error", message: r.message });
    });
    return () => {
      live = false;
    };
  }, []);

  async function remove(id: string) {
    const r = await removeSaved(id);
    if (r.ok && state.kind === "done") {
      setState({ kind: "done", items: state.items.filter((i) => i.id !== id) });
    }
  }

  return (
    <div className="stack-lg">
      <section className="stack">
        <h1>Saved medicines</h1>
        {state.kind === "loading" && <p aria-busy="true">Loading…</p>}
        {state.kind === "error" && (
          <p role="alert" className="notice notice-error">
            {state.message}
          </p>
        )}
        {state.kind === "done" && state.items.length === 0 && (
          <p className="notice">
            Nothing saved yet. <Link href="/">Search a medicine</Link>, open its comparison and press
            Save.
          </p>
        )}
        {state.kind === "done" && state.items.length > 0 && (
          <ul className="cards">
            {state.items.map((m) => (
              <li key={m.id} className="card row">
                <Link href={compareHref(m.key, m.offer_id ?? undefined)} className="grow">
                  <strong>{m.label}</strong>
                </Link>
                <button type="button" className="button button-quiet" onClick={() => void remove(m.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <DeleteAccount />
    </div>
  );
}

function DeleteAccount() {
  const { forget } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string>();

  async function onDelete() {
    if (!window.confirm("Delete your account and everything you saved? This cannot be undone.")) return;
    const r = await deleteAccount();
    if (!r.ok) {
      setError(r.message);
      return;
    }
    forget();
    router.push("/");
  }

  return (
    <section className="stack-sm danger-zone">
      <h2 className="h3">Your data</h2>
      <p className="small muted">
        Deleting your account removes your name, email, sessions and saved medicines right away.
      </p>
      <div>
        <button type="button" className="button button-danger" onClick={() => void onDelete()}>
          Delete my account
        </button>
      </div>
      {error && (
        <p role="alert" className="error-text small">
          {error}
        </p>
      )}
    </section>
  );
}
