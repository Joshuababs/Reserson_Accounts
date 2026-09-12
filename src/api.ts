/**
 * The platform identity API.
 *
 * The only server this app talks to. Every call carries the session cookie —
 * `credentials: "include"` — because the cookie *is* the sign-in, and the whole
 * point of this app is to be the one place it is created and destroyed.
 */
const BASE = import.meta.env.VITE_IDENTITY_URL ?? "http://localhost:9040";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(method: string, path: string, body?: unknown, token?: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  // The platform wraps successes in { message, data }. Unwrapping here keeps every
  // caller in this app dealing with the shape it actually wants.
  const envelope = payload as { data?: T; message?: string } | null;

  if (!res.ok) {
    throw new ApiError(res.status, envelope?.message ?? "Something went wrong. Please try again.");
  }

  return (envelope?.data ?? payload) as T;
}

export interface Product {
  code: string;
  name: string;
  tagline: string | null;
  appUrl: string;
  status: string;
}

export interface Me {
  user: { id: string; firstName: string; lastName: string; email: string; isEmailVerified: boolean };
  businesses: {
    id: string;
    name: string;
    slug: string;
    role: string;
    products: { code: string; name: string; appUrl: string; isPrimary: boolean }[];
  }[];
  landing: { businessId: string; productCode: string; appUrl: string } | null;
}

export interface SignInResult {
  access_token: string;
  user: { id: string; email: string; isEmailVerified: boolean };
  me: Me;
}

export const api = {
  products: () => call<Product[]>("GET", "/identity/products"),
  signIn: (email: string, password: string) =>
    call<SignInResult>("POST", "/identity/sessions", { email, password }),
  signOut: () => call<void>("DELETE", "/identity/sessions/current"),
  /** Trades the session cookie for a token the older endpoints accept. */
  exchange: () => call<{ access_token: string }>("POST", "/identity/sessions/exchange"),
  me: (token?: string) => call<Me>("GET", "/identity/me", undefined, token),
  register: (input: { firstName: string; lastName: string; email: string; password: string }) =>
    call<{ access_token: string; user: { id: string; email: string } }>("POST", "/auth/register", input),
  verifyEmail: (code: string, token: string) => call<unknown>("POST", "/auth/verify-email", { code }, token),
  resendVerification: (token: string) => call<unknown>("POST", "/auth/resend-verification", {}, token),
  createBusiness: (
    input: { businessName: string; currency: string; country: string; phoneNumber?: string; product: string },
    token: string,
  ) => call<{ business: { id: string; name: string; slug: string } }>("POST", "/business/register", input, token),
  activateProduct: (code: string, businessId: string, token: string, makePrimary = false) =>
    call<unknown>("POST", `/identity/products/${code}/activate`, { businessId, makePrimary }, token),
  forgotPassword: (email: string) => call<unknown>("POST", "/auth/forgot-password", { email }),
};
