/**
 * Sign-in is off unless the site is built with NEXT_PUBLIC_SIGN_IN=on. Off: no sign-in link,
 * no account calls, and the account pages say accounts are coming. Next inlines the value at build.
 */
export const signInEnabled = (): boolean => process.env.NEXT_PUBLIC_SIGN_IN === "on";

export function AccountsComingSoon({ title }: { title: string }) {
  return (
    <section className="narrow stack">
      <h1>{title}</h1>
      <p className="muted">
        Accounts are coming soon. Searching and comparing prices work without one.
      </p>
    </section>
  );
}
