import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api, ApiError } from "@/api";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/session";
import { continueTo } from "@/lib/handoff";

/** A short list of the currencies the platform bills and prices in today. */
const CURRENCIES = ["EUR", "GBP", "USD", "NGN"];

const COUNTRIES = [
  { code: "IE", name: "Ireland" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "NG", name: "Nigeria" },
];

/**
 * The business, once.
 *
 * These details describe the business, not the product — the same name, country and
 * currency are true whether they're taking sauna bookings or sending invoices. So
 * they're collected here, by the account layer, and every product reads them. That
 * is the difference between one platform and two apps that happen to share a login.
 */
export default function BusinessDetails() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { token, refresh } = useSession();

  const product = params.get("product") ?? "merchant";
  const [form, setForm] = useState({ businessName: "", country: "IE", currency: "EUR", phoneNumber: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);

    try {
      await api.createBusiness(
        {
          businessName: form.businessName.trim(),
          currency: form.currency,
          country: form.country,
          phoneNumber: form.phoneNumber.trim() || undefined,
          // Registering the business also activates the product they chose, so they
          // land in it rather than on a picker they've already been through.
          product,
        },
        token,
      );

      const me = await refresh();
      const chosen = me?.businesses[0]?.products.find((p) => p.code === product);

      // The end of the funnel: back where they came from if that is this product,
      // otherwise into the product they just set up.
      continueTo({ next: params.get("next"), product: chosen ?? null, me }, navigate);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't save those details.");
      setBusy(false);
    }
  };

  return (
    <Shell title="About your business" standfirst="Used across every Reservon product you turn on.">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label htmlFor="businessName">Business name</Label>
          <Input
            id="businessName"
            value={form.businessName}
            onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
            required
            className="mt-1.5"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="country">Country</Label>
            <select
              id="country"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="phoneNumber">Phone (optional)</Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            className="mt-1.5"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue
        </Button>
      </form>
    </Shell>
  );
}
