import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Lock } from "lucide-react";
import { api } from "@/api";
import { AuthLayout } from "@/components/AuthLayout";
import { Spinner } from "@/components/Spinner";
import { errorMessage, useNotifications } from "@/components/notifications";
import { useSession } from "@/session";
import { continueTo } from "@/lib/handoff";
import Countries from "@/lib/countries";
import { isPhoneNumberInvalid } from "@/lib/phone";
import { useTitle } from "@/lib/title";

const INDUSTRY_OPTIONS = [
  "Salon / Beauty",
  "Fitness / Wellness",
  "Consulting / Coaching",
  "Retail / Services",
  "Healthcare",
  "Freelancer",
  "Others",
];

/** The countries the platform can settle payments in today, as on the merchant dashboard. */
const SUPPORTED_COUNTRY_CODES = ["IE", "DE", "FR", "ES", "NL", "GB", "US"];
const SUPPORTED_COUNTRIES = Countries.filter((c) => SUPPORTED_COUNTRY_CODES.includes(c.code));

const COUNTRY_CURRENCY: Record<string, string> = {
  IE: "EUR",
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  NL: "EUR",
  GB: "GBP",
  US: "USD",
};

/**
 * The business, once — the merchant dashboard's /auth/v2/business.
 *
 * These details describe the business, not the product: the same name, country and
 * currency are true whether they're taking sauna bookings or sending invoices. So
 * they're collected here, by the account layer, and every product reads them. That
 * is the difference between one platform and two apps that happen to share a login.
 */
export default function BusinessDetails() {
  useTitle("Business account");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { token, refresh } = useSession();
  const { toast } = useNotifications();

  const product = params.get("product") ?? "merchant";
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [otherIndustry, setOtherIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedCountry = Countries.find((c) => c.code === country) ?? null;
  const currency = COUNTRY_CURRENCY[country] ?? "";
  const phoneInvalid = isPhoneNumberInvalid(selectedCountry?.dial_code, phone);

  const enableButton = !!(
    businessName.trim() &&
    industry &&
    (industry !== "Others" || otherIndustry.trim()) &&
    country &&
    phone &&
    !phoneInvalid &&
    address.trim()
  );

  const createBusiness = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setLoading(true);

    try {
      await api.createBusiness(
        {
          businessName: businessName.trim(),
          industry: industry === "Others" ? otherIndustry.trim() : industry,
          phoneNumber: `${selectedCountry?.dial_code || ""}-${phone}`,
          address: address.trim(),
          currency,
          country,
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
      toast({ type: "ERROR", msg: errorMessage(err), duration: 10000 });
      setLoading(false);
    }
  };

  return (
    <AuthLayout currentStep={4}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-[22px] md:text-3xl font-bold font-gabarito">Tell us about your business</h3>
          <p className="text-sm text-gray">
            This sets up how you'll get paid — choose carefully, some details can't be changed after signup.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={createBusiness}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="businessName" className="label">
              Business name
            </label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Joshua Consulting"
              className="input-field"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="industry" className="label">
              Industry
            </label>
            <div className="relative">
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={`input-field appearance-none pr-10 cursor-pointer ${industry ? "text-black" : "text-gray"}`}
              >
                <option value="" disabled>
                  Select industry
                </option>
                {INDUSTRY_OPTIONS.map((option) => (
                  <option key={option} value={option} className="text-black">
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="text-gray absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {industry === "Others" && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="otherIndustry" className="label">
                Enter your industry
              </label>
              <input
                id="otherIndustry"
                type="text"
                value={otherIndustry}
                onChange={(e) => setOtherIndustry(e.target.value)}
                placeholder="e.g. Landscaping"
                className="input-field"
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <label htmlFor="country" className="text-sm font-semibold text-primary">
              Country of business registration
            </label>
            <div className="relative">
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={`input-field bg-white appearance-none pr-10 cursor-pointer ${country ? "text-black" : "text-gray"}`}
              >
                <option value="" disabled>
                  Select country
                </option>
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} className="text-black">
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="text-gray absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="flex items-start gap-1.5 text-xs text-primary/80">
              <Lock size={13} strokeWidth={2.4} className="shrink-0 mt-0.5" />
              This sets your currency, phone code, and Stripe setup. Can't be changed after signup.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="label">
              Phone number
            </label>
            <div
              className={[
                "w-full border rounded-lg px-3 py-2 flex items-center gap-2 transition-all duration-200 focus-within:ring-[3px]",
                phoneInvalid
                  ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/30"
                  : "border-[#D1D0D4] focus-within:border-primary focus-within:ring-primary/30",
                selectedCountry ? "" : "opacity-70",
              ].join(" ")}
            >
              {selectedCountry && <span className="text-sm text-gray shrink-0">{selectedCountry.dial_code}</span>}
              <input
                id="phone"
                type="tel"
                value={phone}
                disabled={!selectedCountry}
                placeholder={selectedCountry ? "e.g. 12345678" : "Select a country first"}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                className="flex-grow bg-transparent text-sm text-black placeholder:text-gray focus:outline-none disabled:cursor-not-allowed"
              />
            </div>
            {phoneInvalid && <p className="text-xs font-medium text-red-500">Enter a valid phone number</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="address" className="label">
              Address
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city"
              className="input-field"
              required
            />
          </div>

          <button type="submit" disabled={!enableButton || loading} className="btn-primary mt-2 center gap-2">
            {loading && <Spinner size={16} color="#ffffff" />}
            {loading ? "Processing" : "Continue"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
