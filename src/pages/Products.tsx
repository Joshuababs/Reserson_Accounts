import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { api, ApiError, type Me, type Product } from "@/api";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/session";
import { cn } from "@/lib/utils";
import { continueTo, withNext } from "@/lib/handoff";

/**
 * What are you here for?
 *
 * Rendered from the platform's product registry rather than a list in this file,
 * so a third product appears here the day it is added and never needs a release of
 * this app. Choosing one activates it and hands off; the others stay one click away
 * afterwards, which is the difference between picking a product and being locked
 * into one.
 */
export default function Products() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { me, token, refresh } = useSession();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.products().then(setProducts).catch(() => setProducts([]));
  }, []);

  /**
   * A product chosen before arriving skips the picker.
   *
   * The operator page's "Start free" already told us the answer — asking again on
   * a generic picker is a step that exists only for our convenience. The param is
   * validated against the live registry, so a mistyped link degrades to the picker
   * rather than to a dead end.
   */
  const preselected = params.get("product");
  const autoChosen = useRef(false);
  useEffect(() => {
    if (!preselected || !products || autoChosen.current) return;
    const match = products.find((p) => p.code === preselected);
    if (!match) return;
    autoChosen.current = true;
    void choose(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselected, products]);

  const business = me?.businesses[0];
  const activated = new Set(business?.products.map((p) => p.code) ?? []);

  const choose = async (product: Product) => {
    if (!token) return;

    // No business yet: the details are the same whichever product they picked, so
    // they're collected once and the choice — and where they came from — are carried
    // through to the last step.
    if (!business) {
      navigate(withNext(`/business?product=${product.code}`, params.get("next")));
      return;
    }

    setBusy(product.code);
    setError(null);
    try {
      let account: Me | null = me;
      if (!activated.has(product.code)) {
        await api.activateProduct(product.code, business.id, token, true);
        account = await refresh();
      }

      // Back where they came from when that *is* this product — a deep link into the
      // operator console survives the trip — and to the product itself otherwise.
      continueTo({ next: params.get("next"), product, me: account }, navigate);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't open that product.");
      setBusy(null);
    }
  };

  return (
    <Shell
      title={business ? "Your Reservon products" : "What will you be using?"}
      standfirst={
        business
          ? "Open one, or add another to this account — the business details carry over."
          : "Pick the one you're here for. You can add the other later without signing up again."
      }
    >
      {!products && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <ul className="space-y-3">
        {(products ?? []).map((product) => {
          const isOn = activated.has(product.code);
          return (
            <li key={product.code}>
              <button
                type="button"
                onClick={() => choose(product)}
                disabled={busy !== null}
                className={cn(
                  "group flex w-full items-start justify-between gap-4 rounded-lg border p-5 text-left transition-colors",
                  isOn ? "border-primary/40 bg-primary/[0.04]" : "border-border hover:border-primary/40",
                )}
              >
                <span>
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    {product.name}
                    {isOn && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        <Check className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </span>
                  {product.tagline && (
                    <span className="mt-1 block text-sm text-muted-foreground">{product.tagline}</span>
                  )}
                </span>
                {busy === product.code ? (
                  <Loader2 className="mt-1 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {params.get("next") && (
        <Button variant="ghost" className="mt-6 w-full" onClick={() => (window.location.href = params.get("next")!)}>
          Back to where I was
        </Button>
      )}
    </Shell>
  );
}
