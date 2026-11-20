"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

const DEFAULT_W = 380;
const MIN_W = 260;
/** Dragging the divider closer than this to the left edge folds the search panel away. */
const FOLD_AT = 200;
/** The prices panel always keeps at least this much room. */
const MIN_RIGHT = 420;
const STEP = 24;
const STORE = "nirog:left-width";

function saved(): number {
  try {
    const n = Number(localStorage.getItem(STORE));
    return n >= MIN_W ? n : DEFAULT_W;
  } catch {
    return DEFAULT_W;
  }
}

/** Width of the search panel, whether it is folded away, and the handlers that change them. */
export function useSplit() {
  const [width, setWidth] = useState(DEFAULT_W);
  const [folded, setFolded] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the remembered width after mount (no SSR mismatch)
    setWidth(saved());
  }, []);
  const resize = (w: number, max: number) => {
    if (w < FOLD_AT) return setFolded(true);
    const next = Math.round(Math.min(Math.max(w, MIN_W), max));
    setWidth(next);
    setFolded(false);
    try {
      localStorage.setItem(STORE, String(next));
    } catch {
      // Remembering the width is a convenience only.
    }
  };
  return { width, folded, resize, unfold: () => setFolded(false) };
}

type Props = { width: number; onResize: (w: number, max: number) => void };

/** The draggable line between search and prices. Arrow keys move it; Home folds the search away. */
export function Divider({ width, onResize }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const bounds = () => {
    const shell = ref.current?.parentElement?.getBoundingClientRect();
    // Unknown width (not laid out yet): don't cap the panel.
    return { left: shell?.left ?? 0, max: shell?.width ? Math.max(MIN_W, shell.width - MIN_RIGHT) : Infinity };
  };

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragging(true);
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const b = bounds();
    onResize(e.clientX - b.left, b.max);
  }
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const { max } = bounds();
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      onResize(width + (e.key === "ArrowRight" ? STEP : -STEP), max);
    } else if (e.key === "Home") {
      e.preventDefault();
      onResize(0, max);
    }
  }

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize search and prices"
      aria-valuenow={width}
      aria-valuemin={0}
      aria-valuemax={1240}
      tabIndex={0}
      className={`divider${dragging ? " is-dragging" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={onKeyDown}
    >
      <span className="divider-grip" aria-hidden="true" />
    </div>
  );
}
