import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/api";
import { AuthLayout } from "@/components/AuthLayout";
import { PasswordInput } from "@/components/PasswordInput";
import { Spinner } from "@/components/Spinner";
import { errorMessage, useNotifications } from "@/components/notifications";
import { useSession } from "@/session";
import { withNext } from "@/lib/handoff";
import { useTitle } from "@/lib/title";

const WEBSITE_URL = (import.meta.env.VITE_WEBSITE_URL as string | undefined) ?? "https://reservonhq.com";
const TERMS_URL = `${WEBSITE_URL}/terms-and-conditions`;
const PRIVACY_URL = `${WEBSITE_URL}/privacy-policy`;

/**
 * The merchant dashboard's /auth/v2/signup: the account, and nothing else.
 *
 * No business name, no product, no plan. Those come after, in their own steps,
 * because an account is the only thing that has to exist before an email can be
 * verified — and asking for six fields before the first one is checked is how a
 * signup form loses people.
 */
export default function SignUp() {
  useTitle("Sign up");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, refresh } = useSession();
  const { toast } = useNotifications();

  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [notify, setNotify] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const enableButton =
    acceptTerms && !!(password.length && password === cPassword && fname.trim() && lname.trim() && email.trim());

  const signup = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const result = await api.register({
        firstName: fname.trim(),
        lastName: lname.trim(),
        email: email.trim(),
        password: password.trim(),
      });
      setToken(result.access_token);

      // Registration signs them in as well, so the session cookie exists from here
      // on and the rest of onboarding needs no further password.
      await api.signIn(email.trim(), password.trim()).catch(() => undefined);
      await refresh();

      // Carries a failed send through to the verify screen, so it can ask for a
      // resend instead of telling them to check an inbox nothing was sent to.
      const to = withNext("/verify", params.get("next"), params.get("product"));
      navigate(result.verificationEmailSent === false ? `${to}${to.includes("?") ? "&" : "?"}sent=0` : to);
    } catch (err) {
      toast({ type: "ERROR", msg: errorMessage(err), duration: 10000 });
      setLoading(false);
    }
  };

  return (
    <AuthLayout currentStep={1}>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-gray">
            Already have an account?{" "}
            {/* Carries the destination across, so someone who realises they already
                have an account doesn't lose the page they were sent from. */}
            <Link to={withNext("/signin", params.get("next"), params.get("product"))} className="text-primary font-medium">
              Sign in
            </Link>
          </p>
          <h3 className="text-[22px] md:text-3xl font-bold font-gabarito">Create your account</h3>
          <p className="text-sm text-gray">
            Takes about 2 minutes. You can start booking customers before payments are fully set up.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={signup}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex gap-1.5 flex-col">
              <label htmlFor="fname" className="label">
                First name
              </label>
              <input
                id="fname"
                type="text"
                value={fname}
                onChange={(e) => setFname(e.target.value)}
                placeholder="Enter your first name"
                autoComplete="given-name"
                className="input-field"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lname" className="label">
                Last name
              </label>
              <input
                id="lname"
                type="text"
                value={lname}
                onChange={(e) => setLname(e.target.value)}
                placeholder="Enter your last name"
                autoComplete="family-name"
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              className="input-field"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="label">
              Create a password
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="c_password" className="label">
              Confirm password
            </label>
            <PasswordInput
              id="c_password"
              value={cPassword}
              onChange={setCPassword}
              placeholder="Re-enter password"
              autoComplete="new-password"
              required
            />
            {cPassword.length > 0 && password !== cPassword && (
              <p className="text-xs text-[#D3351D]">
                Password does not match, please make sure this password is the same as the one above.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <input id="notify" type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="mt-1" />
              <label htmlFor="notify" className="text-sm text-gray cursor-pointer">
                Notify me on new offers, product updates and other news.
              </label>
            </div>
            <div className="flex items-start gap-2">
              <input
                id="accept_terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="accept_terms" className="text-sm text-gray">
                I agree to Reservon's{" "}
                <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="text-primary font-medium">
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="text-primary font-medium">
                  Privacy Policy
                </a>
                .
              </label>
            </div>
          </div>

          <button type="submit" disabled={!enableButton || loading} className="btn-primary w-full mt-5 center gap-2">
            {loading && <Spinner size={16} color="#ffffff" />}
            {loading ? "Processing" : "Continue"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
