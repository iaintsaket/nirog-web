"use client";

import Link from "next/link";
import { Pulse } from "@/ui/Pulse";

/** Fired when the home link is pressed, so a search page already on screen can reset itself. */
export const HOME_EVENT = "nirog:home";

export function HomeLink() {
  return (
    <Link href="/" className="brand" aria-label="Nirog home" onClick={() => window.dispatchEvent(new Event(HOME_EVENT))}>
      <Pulse size="md" /> Nirog
    </Link>
  );
}
