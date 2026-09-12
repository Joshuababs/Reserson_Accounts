import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api, ApiError } from "@/api";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/session";
import { withNext } from "@/lib/handoff";

export default function Verify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { me, token, refresh } = useSession();

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);

    try {
      await api.verifyEmail(code.trim(), token);
      await refresh();
      // Always the picker next, even with no business yet: which product they are
      // here for decides what the business step is *for*, and the picker sends them
      // there carrying the answer. Going straight to business details would mean
      // guessing the product and landing half of them in the wrong app.
      navigate(withNext("/products", params.get("next"), params.get("product")));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That code didn't work.");
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!token) return;
    await api.resendVerification(token).catch(() => undefined);
    setSent(true);
  };

  return (
    <Shell
      title="Check your email"
      standfirst={`We've sent a six-digit code to ${me?.user.email ?? "your address"}.`}
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            className="mt-1.5 font-mono text-lg tracking-[0.4em]"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={busy || code.length < 6}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify
        </Button>

        <button type="button" onClick={resend} className="w-full text-center text-sm text-muted-foreground underline underline-offset-4">
          {sent ? "Sent — check your inbox again" : "Send it again"}
        </button>
      </form>
    </Shell>
  );
}
