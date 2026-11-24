import { useRef, useState, type PointerEvent } from "react";

/** How far down (px) a drag must travel to close; shorter drags spring back. */
const CLOSE_AFTER = 100;
/** A quick flick closes too: at least this far, faster than FLICK_SPEED px/ms. */
const FLICK_MIN = 30;
const FLICK_SPEED = 0.5;

/**
 * Drag-down-to-close for a bottom sheet. Spread `handlers` on the sheet's grab bar and move the
 * sheet by `offset` px. Drags that start on a button are left to the button.
 */
export function useDragToClose(onClose: () => void) {
  const [offset, setOffset] = useState(0);
  const start = useRef<{ y: number; t: number } | null>(null);

  const reset = () => {
    start.current = null;
    setOffset(0);
  };

  const handlers = {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      if ((e.target as Element).closest("button")) return;
      start.current = { y: e.clientY, t: e.timeStamp };
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      if (start.current) setOffset(Math.max(0, e.clientY - start.current.y));
    },
    onPointerUp(e: PointerEvent<HTMLElement>) {
      if (!start.current) return;
      const moved = e.clientY - start.current.y;
      const speed = moved / Math.max(e.timeStamp - start.current.t, 1);
      reset();
      if (moved > CLOSE_AFTER || (moved > FLICK_MIN && speed > FLICK_SPEED)) onClose();
    },
    onPointerCancel: reset,
  };

  return { offset, handlers };
}
