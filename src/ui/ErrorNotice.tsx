export function ErrorNotice({ children }: { children: string }) {
  return (
    <p role="alert" className="notice notice-error">
      {children}
    </p>
  );
}
