import type { ReactNode } from "react";
import logo from "@/assets/logo-full-dark.svg";

/**
 * The frame every screen sits in.
 *
 * Deliberately plain and deliberately unbranded beyond Reservon itself: this app
 * belongs to no product, and a customer arriving here from the operator console
 * should feel they've stepped into the account layer, not into the other product.
 */
export function Shell({
  title,
  standfirst,
  children,
  footer,
}: {
  title: string;
  standfirst?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center px-6">
          <img src={logo} alt="Reservon" className="h-7 w-auto" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-12">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        {standfirst && <p className="mt-2 text-sm text-muted-foreground">{standfirst}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 text-sm text-muted-foreground">{footer}</div>}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-5 text-xs text-muted-foreground">
          One Reservon account for every product.
        </div>
      </footer>
    </div>
  );
}
