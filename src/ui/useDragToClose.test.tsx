import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { useDragToClose } from "./useDragToClose";

function Sheet({ onClose }: { onClose: () => void }) {
  const { offset, handlers } = useDragToClose(onClose);
  return (
    <section aria-label="sheet" style={{ transform: `translateY(${offset}px)` }}>
      <div data-testid="bar" {...handlers}>
        <button type="button">Close</button>
      </div>
    </section>
  );
}

const drag = (el: Element, from: number, to: number) => {
  fireEvent.pointerDown(el, { clientY: from, pointerId: 1 });
  fireEvent.pointerMove(el, { clientY: to, pointerId: 1 });
  fireEvent.pointerUp(el, { clientY: to, pointerId: 1 });
};

test("dragging the sheet bar down closes the sheet; a short drag springs back", () => {
  const onClose = vi.fn();
  render(<Sheet onClose={onClose} />);
  const bar = screen.getByTestId("bar");

  fireEvent.pointerDown(bar, { clientY: 100, pointerId: 1 });
  fireEvent.pointerMove(bar, { clientY: 160, pointerId: 1 });
  expect(screen.getByLabelText("sheet").style.transform).toBe("translateY(60px)"); // follows the finger
  fireEvent.pointerMove(bar, { clientY: 40, pointerId: 1 });
  expect(screen.getByLabelText("sheet").style.transform).toBe("translateY(0px)"); // never above its resting place
  fireEvent.pointerUp(bar, { clientY: 120, pointerId: 1 });
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByLabelText("sheet").style.transform).toBe("translateY(0px)");

  drag(bar, 100, 260);
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("a drag that starts on the Close button is left to the button", () => {
  const onClose = vi.fn();
  render(<Sheet onClose={onClose} />);
  drag(screen.getByRole("button", { name: "Close" }), 100, 300);
  expect(onClose).not.toHaveBeenCalled();
});
