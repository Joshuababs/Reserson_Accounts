import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/api";
import { AuthLayout } from "@/components/AuthLayout";
import { Spinner } from "@/components/Spinner";
import { errorMessage, useNotifications } from "@/components/notifications";
import { useTitle } from "@/lib/title";

/**
 * The merchant dashboard's /auth/v2/reset: the emailed code, the address it went
 * to, and the new password. Succeeding ends every session for that account.
 */
export default function Reset() {
  useTitle("Reset password");
  const navigate = useNavigate();
  const { toast, alert } = useNotifications();

  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const enableButton = !!(code.trim() && email.trim() && password.length && password === cPassword);

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { message } = await api.resetPassword({
        code: String(code.trim()),
        email: email.trim(),
        newPassword: password.trim(),
      });
      alert({
        type: "SUCCESS",
        title: "Success",
        msg: message || "You have created a new password successfully",
        buttonText: "Ok, back to Login",
        buttonAction: () => navigate("/signin"),
        allowBgClose: false,
      });
      setCode("");
      setEmail("");
      setPassword("");
      setCPassword("");
    } catch (err) {
      toast({ type: "ERROR", msg: errorMessage(err), duration: 10000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout type="others">
      <div className="flex flex-col gap-6 w-full max-w-[420px]">
        <div className="flex flex-col gap-1">
          <h3 className="text-[22px] md:text-3xl font-bold font-gabarito">Reset password</h3>
          <p className="text-sm text-gray">Create your new password.</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={resetPassword}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="code" className="label">
              Code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter the code from your email"
              className="input-field"
              required
            />
          </div>

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
            <label htmlFor="password" className="label">
              Create a password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="input-field"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="c_password" className="label">
              Confirm password
            </label>
            <input
              id="c_password"
              type="password"
              autoComplete="new-password"
              value={cPassword}
              onChange={(e) => setCPassword(e.target.value)}
              placeholder="Re-enter password"
              className="input-field"
              required
            />
            {cPassword.length > 0 && password !== cPassword && (
              <p className="text-xs text-[#D3351D]">
                Password does not match, please make sure this password is the same as the one above.
              </p>
            )}
          </div>

          <button type="submit" disabled={!enableButton || loading} className="btn-primary mt-2 center gap-2">
            {loading && <Spinner size={16} color="#ffffff" />}
            {loading ? "Processing" : "Reset password"}
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
