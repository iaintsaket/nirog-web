"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { AccountsComingSoon, signInEnabled } from "@/features/auth/signInFlag";
import { compareHref } from "@/lib/medicines";
import { deleteAccount } from "@/services/account";
import { listSaved, removeSaved } from "@/services/saved";
import { useResult } from "@/services/useResult";
import { ErrorNotice } from "@/ui/ErrorNotice";

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
  const r = useResult(listSaved, []);
  const [removed, setRemoved] = useState<string[]>([]);
  const items = r?.ok ? r.data.filter((i) => !removed.includes(i.id)) : [];

  async function remove(id: string) {
    if ((await removeSaved(id)).ok) setRemoved((ids) => [...ids, id]);
  }

  return (
    <div className="stack-lg">
      <section className="stack">
        <h1>Saved medicines</h1>
        {!r && <p aria-busy="true">Loading…</p>}
        {r && !r.ok && <ErrorNotice>{r.message}</ErrorNotice>}
        {r?.ok && items.length === 0 && (
          <p className="notice">
            Nothing saved yet. <Link href="/">Search a medicine</Link>, open its comparison and press
            Save.
          </p>
        )}
        {items.length > 0 && (
          <ul className="cards">
            {items.map((m) => (
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
