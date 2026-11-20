"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { saveMatch } from "@/services/saved";

type Props = { matchKey: string; offerId?: string; defaultLabel: string };

export function SaveButton({ matchKey, offerId, defaultLabel }: Props) {
  const [label, setLabel] = useState(defaultLabel.slice(0, 120));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | { error: string }>("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("saving");
    const r = await saveMatch(matchKey, label.trim(), offerId);
    setStatus(r.ok ? "saved" : { error: r.message });
  }

  if (status === "saved") {
    return (
      <p role="status" className="notice">
        Saved. <Link href="/saved">See your saved medicines</Link>
      </p>
    );
  }
  return (
    <form className="save-form" onSubmit={onSubmit}>
      <label htmlFor="save-label" className="small">
        Save as
      </label>
      <input
        id="save-label"
        value={label}
        maxLength={120}
        required
        onChange={(e) => setLabel(e.target.value)}
      />
      <button type="submit" className="button" disabled={status === "saving" || !label.trim()}>
        Save
      </button>
      {typeof status === "object" && (
        <span role="alert" className="error-text small">
          {status.error}
        </span>
      )}
    </form>
  );
}
