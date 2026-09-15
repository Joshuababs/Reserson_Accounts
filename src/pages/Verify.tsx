import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/api";
import { AuthLayout } from "@/components/AuthLayout";
import { OtpInput } from "@/components/OtpInput";
import { Spinner } from "@/components/Spinner";
import { errorMessage, useNotifications } from "@/components/notifications";
import { useSession } from "@/session";
import { withNext } from "@/lib/handoff";
import { useTitle } from "@/lib/title";

const EXPIRY_SECONDS = 587;
const RESEND_COOLDOWN_SECONDS = 60;

/** The merchant dashboard's /auth/v2/verification: six boxes, a resend, a countdown. */
export default function Verify() {
  useTitle("Verify email");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { me, token, refresh } = useSession();
  const { toast, alert } = useNotifications();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
  const expiryTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startExpiryCountdown = () => {
    if (expiryTimer.current) clearInterval(expiryTimer.current);
    setSecondsLeft(EXPIRY_SECONDS);
    expiryTimer.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 0) return s - 1;
        if (expiryTimer.current) clearInterval(expiryTimer.current);
        expiryTimer.current = null;
        return 0;
      });
    }, 1000);
  };

  useEffect(() => {
    startExpiryCountdown();
    return () => {
      if (expiryTimer.current) clearInterval(expiryTimer.current);
    };
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedExpiry = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const verifyEmail = async () => {
    if (!token) return;
    setLoading(true);

    try {
      await api.verifyEmail(otp.trim(), token);
      await refresh();
      toast({ type: "SUCCESS", msg: "Your email has been verified successfully" });
      // Always the picker next, even with no business yet: which product they are
      // here for decides what the business step is *for*, and the picker sends them
      // there carrying the answer.
      navigate(withNext("/products", params.get("next"), params.get("product")));
    } catch (err) {
      toast({ type: "ERROR", msg: errorMessage(err), duration: 10000 });
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!token || resendCooldown > 0) return;
    setResending(true);

    try {
      await api.resendVerification(token);
      alert({
        type: "SUCCESS",
        title: "Verification code sent",
        msg: "A new verification code has been sent to your email",
      });
      setOtp("");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      startExpiryCountdown();
    } catch (err) {
      toast({ type: "ERROR", msg: errorMessage(err), duration: 10000 });
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout currentStep={2}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-[22px] md:text-3xl font-bold font-gabarito">Verify your email</h3>
          <p className="text-sm text-gray">Enter the 6-digit code we just sent.</p>
        </div>

        <div className="rounded-lg bg-primary/10 text-primary text-sm font-semibold text-center py-3 px-4">
          Sent to {me?.user.email || "your email"}
        </div>

        <OtpInput value={otp} onChange={setOtp} />

        <p className="text-sm text-gray text-center">
          Didn't get it?{" "}
          <button
            type="button"
            className="text-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={resending || resendCooldown > 0}
            onClick={resendCode}
          >
            {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : resending ? "Resending..." : "Resend code"}
          </button>
          <br />
          Code expires in {formattedExpiry}
        </p>

        <div className="grid grid-cols-1 gap-4">
          <button type="button" className="btn-primary center gap-2" disabled={otp.length < 6 || loading} onClick={verifyEmail}>
            {loading && <Spinner size={16} color="#ffffff" />}
            {loading ? "Verifying" : "Verify & continue"}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
