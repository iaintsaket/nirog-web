"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { prefersStill } from "@/ui/motion";
import { CARDS } from "./cards";

const LAST = CARDS.length - 1;
const clamp = (n: number) => Math.max(0, Math.min(LAST, n));

/**
 * Horizontal cards you can swipe, drag, step with the arrows or the keyboard, or jump to with the
 * dots. The art in each card sits in three layers that slide at different speeds as the track
 * scrolls (parallax); that, and the hover tilt, are skipped for people who ask for less motion.
 * Without JavaScript it is still a row you can scroll, and the controls are hidden.
 */
export function AboutCarousel() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const cards = () => Array.from(track.current?.querySelectorAll<HTMLElement>("[data-card]") ?? []);
  const step = () => {
    const c = cards();
    return c.length > 1 ? c[1].offsetLeft - c[0].offsetLeft : c[0]?.offsetWidth || 1;
  };

  const go = (n: number) => {
    const c = cards();
    const i = clamp(n);
    if (!c[i] || !track.current) return;
    track.current.scrollTo({ left: c[i].offsetLeft - c[0].offsetLeft, behavior: prefersStill() ? "auto" : "smooth" });
  };

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const s = step();
    const at = el.scrollLeft / s;
    const atEnd = el.scrollWidth > el.clientWidth && el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
    setActive(atEnd ? LAST : clamp(Math.round(at)));
    if (prefersStill()) return;
    cards().forEach((card, i) => {
      const p = i - at;
      card.style.setProperty("--p", String(+p.toFixed(3)));
      card.style.setProperty("--d", String(+Math.min(Math.abs(p), 1).toFixed(3)));
    });
  };

  // Start the layers in place, so the first card isn't offset before anyone scrolls.
  useEffect(() => {
    if (!prefersStill()) onScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKey = (e: KeyboardEvent) => {
    const to = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: LAST }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    go(to);
  };

  // Mouse drag; touch and pen already scroll the row natively.
  const drag = useRef<{ x: number; from: number } | null>(null);
  const dragStart = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !track.current) return;
    drag.current = { x: e.clientX, from: track.current.scrollLeft };
    track.current.classList.add("dragging");
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const dragMove = (e: React.PointerEvent<HTMLElement>) => {
    if (drag.current && track.current) track.current.scrollLeft = drag.current.from - (e.clientX - drag.current.x);
  };
  const dragEnd = () => {
    if (!drag.current || !track.current) return;
    drag.current = null;
    track.current.classList.remove("dragging");
    go(Math.round(track.current.scrollLeft / step()));
  };

  const tilt = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse" || prefersStill()) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
    e.currentTarget.style.setProperty("--ry", `${(x * 7).toFixed(2)}deg`);
  };
  const level = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.removeProperty("--rx");
    e.currentTarget.style.removeProperty("--ry");
  };

  return (
    <section className="about-carousel" role="region" aria-roledescription="carousel" aria-label="About Nirog">
      <noscript>
        <style>{".about-controls{display:none}"}</style>
      </noscript>
      <div className="about-track" data-track ref={track} tabIndex={0} onScroll={onScroll} onKeyDown={onKey}
        onPointerDown={dragStart} onPointerMove={dragMove} onPointerUp={dragEnd} onPointerCancel={dragEnd} aria-label="Cards, use the arrow keys to move">
        {CARDS.map((card, i) => (
          <article
            key={card.title}
            id={card.id}
            data-card={i}
            data-tone={card.tone}
            className="about-card"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${CARDS.length}`}
            onPointerMove={tilt}
            onPointerLeave={level}
          >
            <div className="about-art" aria-hidden="true">
              {card.art.map((layer, n) => (
                <div key={n} className={`about-layer about-layer-${n}`}>
                  {layer}
                </div>
              ))}
            </div>
            <div className="about-copy">
              <p className="about-count">
                {String(i + 1).padStart(2, "0")} <span>/ {String(CARDS.length).padStart(2, "0")}</span>
              </p>
              <h2>{card.title}</h2>
              <p>{card.body}</p>
              {card.link && (
                <a className="about-link" href={card.link.href} rel="noopener noreferrer">
                  {card.link.label} →
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="about-controls">
        <button type="button" className="about-arrow" aria-label="Previous card" disabled={active === 0} onClick={() => go(active - 1)}>
          <svg viewBox="0 0 12 12" width="14" height="14" aria-hidden="true"><path d="M7.5 2.5 4 6l3.5 3.5" /></svg>
        </button>
        <div className="about-dots">
          {CARDS.map((card, i) => (
            <button
              key={card.title}
              type="button"
              className="about-dot"
              aria-label={`Go to card ${i + 1}`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>
        <button type="button" className="about-arrow" aria-label="Next card" disabled={active === LAST} onClick={() => go(active + 1)}>
          <svg viewBox="0 0 12 12" width="14" height="14" aria-hidden="true"><path d="M4.5 2.5 8 6 4.5 9.5" /></svg>
        </button>
      </div>
    </section>
  );
}
