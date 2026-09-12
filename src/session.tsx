import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type Me } from "@/api";

interface SessionState {
  me: Me | null;
  /** The legacy token, held only for the calls that still need one. */
  token: string | null;
  loading: boolean;
  setToken: (token: string | null) => void;
  refresh: () => Promise<Me | null>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

/**
 * Who is signed in, from the cookie.
 *
 * The cookie is the source of truth, not anything in this app's memory: a customer
 * who signed in on another Reservon product a minute ago arrives here already
 * signed in, and the first thing this app must do is notice that rather than ask
 * them for a password they've just typed elsewhere.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem("reservon_legacy_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) sessionStorage.setItem("reservon_legacy_token", token);
    else sessionStorage.removeItem("reservon_legacy_token");
  }, [token]);

  const refresh = useCallback(async () => {
    try {
      const next = await api.me(token ?? undefined);
      setMe(next);

      /**
       * Recover a working token from the cookie alone.
       *
       * A customer who signs up, closes the tab and comes back from their email has
       * a session but nothing in this tab's storage — and the screens that finish
       * onboarding still call endpoints that want the older token. Without this they
       * see their own email on the verification screen and a button that does
       * nothing.
       */
      if (!token) {
        const exchanged = await api.exchange().catch(() => null);
        if (exchanged?.access_token) setToken(exchanged.access_token);
      }

      return next;
    } catch {
      setMe(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await api.signOut().catch(() => undefined);
    setToken(null);
    setMe(null);
  }, []);

  const value = useMemo(
    () => ({ me, token, loading, setToken, refresh, signOut }),
    [me, token, loading, refresh, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
