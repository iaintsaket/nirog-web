/** The Nirog mark beating like a heart, with rings rippling out. Decorative: pair it with text. */
export function Pulse({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <span className={`pulse pulse-${size}`} aria-hidden="true">
      <span className="pulse-ring" />
      <span className="pulse-ring pulse-ring-late" />
      <span className="pulse-mark">+</span>
    </span>
  );
}

/** A short loading line: the pulse and what is happening. */
export function Loading({ children }: { children: string }) {
  return (
    <p className="loading-row" aria-busy="true">
      <Pulse size="sm" /> {children}
    </p>
  );
}
