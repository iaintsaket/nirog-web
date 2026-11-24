import type { CSSProperties } from "react";

/** Place in the entrance line-up (`.intro` in globals.css): items land one after another. */
export const lineUp = (i: number) => ({ "--i": i }) as CSSProperties;

export function prefersStill(): boolean {
  return typeof window.matchMedia !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
