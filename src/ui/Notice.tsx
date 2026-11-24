/** A calm, neutral message: nothing went wrong, there is just nothing to show. */
export function Notice({ children }: { children: string }) {
  return (
    <p role="status" className="notice">
      {children}
    </p>
  );
}
