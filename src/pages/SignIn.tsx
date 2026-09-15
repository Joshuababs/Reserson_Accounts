import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/api";
import { AuthLayout } from "@/components/AuthLayout";
import { PasswordInput } from "@/components/PasswordInput";
import { Spinner } from "@/components/Spinner";
import { errorMessage, useNotifications } from "@/components/notifications";
import { useSession } from "@/session";
import { continueTo, withNext } from "@/lib/handoff";
import { useTitle } from "@/lib/title";

/** The merchant dashboard's /auth/v2/login, on the account layer's sign-in flow. */
export default function SignIn() {
  useTitle("Log in");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, refresh } = useSession();
  const { toast } = useNotifications();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const enableButton = !!(password.length && email.trim());

  const loginUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const result = await api.signIn(email.trim(), password.trim());
      setToken(result.access_token);
      const me = await refresh();

      // Where they were going, or where their account says they belong. A customer
      // who clicked "sign in" on the operator console ends up back there, not on a
      // product picker they didn't ask for.
      continueTo({ next: params.get("next"), me: me ?? result.me }, navigate);
    } catch (err) {
      toast({ type: "ERROR", msg: errorMessage(err), duration: 10000 });
      setLoading(false);
    }
  };

  return (
    <AuthLayout type="others">
      <div className="flex flex-col gap-6 w-full max-w-[420px]">
        <div className="flex flex-col gap-1">
          <h3 className="text-[22px] md:text-3xl font-bold font-gabarito">Welcome back</h3>
          <p className="text-sm text-gray">Log in to manage your bookings, invoices and payments.</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={loginUser}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com"
              className="input-field"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="password" className="label">
                Password
              </label>
              <Link to="/forgot" className="text-sm font-medium text-primary">
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" disabled={!enableButton || loading} className="btn-primary mt-2 center gap-2">
            {loading && <Spinner size={16} color="#ffffff" />}
            {loading ? "Signing in" : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-gray text-center">
          New to Reservon?{" "}
          <Link to={withNext("/signup", params.get("next"), params.get("product"))} className="text-primary font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
