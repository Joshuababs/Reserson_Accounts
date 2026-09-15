import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/api";
import { AuthLayout } from "@/components/AuthLayout";
import { Spinner } from "@/components/Spinner";
import { errorMessage, useNotifications } from "@/components/notifications";
import { useTitle } from "@/lib/title";

/** The merchant dashboard's /auth/v2/forgot. A code goes out; the next screen takes it. */
export default function Forgot() {
  useTitle("Forgot password");
  const navigate = useNavigate();
  const { toast } = useNotifications();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const forgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      // The API answers the same way whether or not the address has an account, so
      // this screen never confirms one exists.
      const { message } = await api.forgotPassword(email.trim());
      toast({ type: "SUCCESS", msg: message || "Password reset link has been sent to your email.", duration: 10000 });
      setEmail("");
      navigate("/reset");
    } catch (err) {
      toast({ type: "ERROR", msg: errorMessage(err), duration: 10000 });
      setLoading(false);
    }
  };

  return (
    <AuthLayout type="others">
      <div className="flex flex-col gap-6 w-full max-w-[420px]">
        <div className="flex flex-col gap-1">
          <h3 className="text-[22px] md:text-3xl font-bold font-gabarito">Forgot password</h3>
          <p className="text-sm text-gray">Provide the email attached to this account.</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={forgotPassword}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com"
              autoComplete="email"
              className="input-field"
              required
            />
          </div>

          <button type="submit" disabled={!email.trim() || loading} className="btn-primary mt-2 center gap-2">
            {loading && <Spinner size={16} color="#ffffff" />}
            {loading ? "Sending" : "Send reset link"}
          </button>
        </form>

        <p className="text-sm text-gray text-center">
          Remember password?{" "}
          <Link to="/signin" className="text-primary font-medium">
            Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
