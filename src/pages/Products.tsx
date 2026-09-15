import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarDays, Check, LayoutGrid } from "lucide-react";
import { api, type Me, type Product } from "@/api";
import { AuthLayout } from "@/components/AuthLayout";
import { Spinner } from "@/components/Spinner";
import { errorMessage, useNotifications } from "@/components/notifications";
import { useSession } from "@/session";
import { continueTo, withNext } from "@/lib/handoff";
import { useTitle } from "@/lib/title";

/**
 * What are you here for?
 *
 * Rendered from the platform's product registry rather than a list in this file,
 * so a third product appears here the day it is added and never needs a release of
 * this app. Choosing one activates it and hands off; the others stay one click away
 * afterwards, which is the difference between picking a product and being locked
 * into one. Drawn like the merchant dashboard's "choose modules" cards.
 */
export default function Products() {
  useTitle("Choose product");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { me, token, refresh } = useSession();
  const { toast } = useNotifications();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

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
      toast({ type: "ERROR", msg: errorMessage(err, "We couldn't open that product."), duration: 10000 });
      setBusy(null);
    }
  };

  const layoutProps = business ? { type: "others" as const, showLogout: true } : { currentStep: 3 };

  return (
    <AuthLayout {...layoutProps}>
      <div className="flex flex-col gap-6 w-full max-w-[600px]">
        <div className="flex flex-col gap-1">
          <h3 className="text-[22px] md:text-3xl font-bold font-gabarito">
            {business ? "Your Reservon products" : "What will you be using?"}
          </h3>
          <p className="text-sm text-gray">
            {business
              ? "Open one, or add another to this account — the business details carry over."
              : "Pick the one you're here for. You can add the other later without signing up again."}
          </p>
        </div>

        {!products && (
          <div className="center py-8">
            <Spinner size={32} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {(products ?? []).map((product) => {
            const isOn = activated.has(product.code);
            const Icon = product.code === "operator" ? LayoutGrid : CalendarDays;
            return (
              <button
                key={product.code}
                type="button"
                onClick={() => choose(product)}
                disabled={busy !== null}
                className={`flex items-center justify-between gap-4 rounded-xl border p-4 md:p-5 text-left transition-colors disabled:cursor-not-allowed ${
                  isOn ? "border-primary bg-primary/5" : "border-[#D1D0D4] hover:border-primary"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg center shrink-0 ${isOn ? "bg-primary" : "bg-[#E8E7E9]"}`}>
                    <Icon size={18} strokeWidth={2.2} className={isOn ? "text-white" : "text-gray"} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-bold text-black flex items-center gap-2">
                      {product.name}
                      {isOn && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          <Check size={12} strokeWidth={2.6} />
                          Active
                        </span>
                      )}
                    </p>
                    {product.tagline && <p className="text-xs font-medium text-gray">{product.tagline}</p>}
                  </div>
                </div>
                {busy === product.code ? (
                  <Spinner size={20} />
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 center shrink-0 ${isOn ? "border-primary" : "border-[#D1D0D4]"}`}>
                    {isOn && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {params.get("next") && (
          <button
            type="button"
            className="btn-primary bg-primary/15 text-primary"
            onClick={() => (window.location.href = params.get("next")!)}
          >
            Back to where I was
          </button>
        )}
      </div>
    </AuthLayout>
  );
}
