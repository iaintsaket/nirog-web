"use client";

import { useEffect, useRef, useState } from "react";
import { prefersStill } from "./motion";
import { Pulse } from "./Pulse";

/** How long the loader beats before flying to the header, and how long the flight takes. */
const HOLD_MS = 450;
const FLY_MS = 700;

/**
 * First-load loader. The mark beats in the centre, then shrinks and flies into the header logo's
 * place while the backdrop fades. Without motion (or without the Web Animations API) it just goes.
 * A CSS fallback fades it out even if this script never runs.
 */
export function Splash() {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = root.current;
    const mark = el?.querySelector<HTMLElement>(".pulse");
    const target = document.querySelector<HTMLElement>(".brand .pulse");
    if (!el || !mark || !target || prefersStill() || typeof mark.animate !== "function") {
      setGone(true);
      return;
    }
    const html = document.documentElement;
    const finish = () => {
      html.classList.remove("splashing");
      setGone(true);
    };
    html.classList.add("splashing");
    // Animations can stall (background tabs); the header logo must never stay hidden.
    const backstop = setTimeout(finish, HOLD_MS + FLY_MS + 300);
    const timer = setTimeout(() => {
      const from = mark.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      el.classList.add("splash-flying");
      el.querySelector<HTMLElement>(".splash-bg")?.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: FLY_MS * 0.7,
        delay: FLY_MS * 0.2,
        fill: "forwards",
      });
      const fly = mark.animate(
        [{ transform: "none" }, { transform: `translate(${dx}px, ${dy}px) scale(${to.width / from.width})` }],
        { duration: FLY_MS, easing: "cubic-bezier(.65, 0, .25, 1)", fill: "forwards" },
      );
      fly.onfinish = finish;
    }, HOLD_MS);
    return () => {
      clearTimeout(timer);
      clearTimeout(backstop);
      html.classList.remove("splashing");
    };
  }, []);

  if (gone) return null;
  return (
    <div ref={root} className="splash" aria-hidden="true">
      <div className="splash-bg" />
      <Pulse size="lg" />
    </div>
  );
}
