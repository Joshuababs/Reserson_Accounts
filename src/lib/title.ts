import { useEffect } from "react";

/**
 * Browser tab title, the way the merchant dashboard does it: each screen sets a
 * short label and the product name is appended ("Log in · Reservon").
 */
export function useTitle(title: string): void {
  useEffect(() => {
    const label = title.trim();
    document.title = !label || label === "Reservon" ? "Reservon" : `${label} · Reservon`;
  }, [title]);
}
