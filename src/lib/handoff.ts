import type { NavigateFunction } from "react-router-dom";
import type { Me } from "@/api";

/**
 * Where a customer goes when the accounts app is finished with them.
 *
 * Three rules, in order:
 *
 *   1. **Back where they came from** — the `?next=` a product added when it sent
 *      them here, so a deep link into the operator console survives a round trip
 *      through sign-in.
 *   2. **Their primary product** — for someone who arrived at accounts directly and
 *      has nowhere in particular to be.
 *   3. **The picker** — a new account with no product yet.
 *
 * Rule 1 has one exception, and it exists because of a loop. If a customer was sent
 * here by the operator console and then chose the *bookings* product, returning them
 * to the console would land them in a product they haven't activated, which bounces
 * them back here — forever. So when a product has just been chosen, `next` is only
 * honoured if it belongs to that product.
 */
export interface ReturnContext {
  next: string | null;
  /** The product just chosen or activated, if this was a product decision. */
  product?: { code: string; appUrl: string } | null;
  me: Me | null;
}

export function returnTarget({ next, product, me }: ReturnContext): string | null {
  const safe = safeNext(next);

  if (safe) {
    // No product decision was made — a plain sign-in — so wherever they came from
    // is right by definition.
    if (!product) return safe;
    if (sameOrigin(safe, product.appUrl)) return safe;
    // They came from one product and chose another. Honouring `next` here is the
    // loop described above; the product they actually picked is the right answer.
    return product.appUrl;
  }

  if (product) return product.appUrl;
  if (me?.landing) return me.landing.appUrl;
  return null;
}

/** Sends them on, or routes within this app when there is nowhere to send them. */
export function continueTo(context: ReturnContext, navigate: NavigateFunction): void {
  const target = returnTarget(context);

  if (target) {
    // A full navigation, not a router push: the destination is another app.
    window.location.href = target;
    return;
  }

  navigate(context.me?.businesses.length ? "/products" : "/products");
}

/** Carries `?next=` (and optionally `?product=`) from one screen to the next. */
export function withNext(path: string, next: string | null, product?: string | null): string {
  const params = new URLSearchParams();
  if (product) params.set("product", product);
  if (next) params.set("next", next);
  const query = params.toString();
  if (!query) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${query}`;
}

function sameOrigin(a: string, b: string): boolean {
  try {
    return new URL(a).origin === new URL(b).origin;
  } catch {
    return false;
  }
}

/**
 * Only ever redirects to Reservon.
 *
 * `next` arrives in a query string, which means anyone can put anything in it. An
 * open redirect from a sign-in page is a phishing primitive: a link that genuinely
 * signs you in and then drops you on a copy of the product asking for your card. So
 * the host is checked against an allowlist and anything else is ignored rather than
 * followed.
 *
 * Protocol is checked too — `javascript:` and `data:` URLs have no host, and would
 * otherwise sail through a hostname test.
 */
function safeNext(next: string | null): string | null {
  if (!next) return null;

  try {
    const url = new URL(next, window.location.origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.origin === window.location.origin) return url.toString();

    const allowed = (import.meta.env.VITE_ALLOWED_RETURN_HOSTS ?? "reservonhq.com,localhost")
      .split(",")
      .map((host: string) => host.trim())
      .filter(Boolean);

    const ok = allowed.some(
      (host: string) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    );
    return ok ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Exported for the tests that prove the allowlist actually holds. */
export const __testing = { safeNext };
