import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api } from "@/api";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    // Always reports success, whatever happened: whether an address has an account
    // is not something an unauthenticated form should confirm.
    await api.forgotPassword(email.trim()).catch(() => undefined);
    setSent(true);
    setBusy(false);
  };

  if (sent) {
    return (
      <Shell title="Check your email" standfirst={`If ${email} has a Reservon account, a reset link is on its way.`}>
        <Button asChild variant="secondary" className="w-full">
          <Link to="/signin">Back to sign in</Link>
        </Button>
      </Shell>
    );
  }

  return (
    <Shell title="Reset your password" standfirst="We'll email you a link.">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="mt-1.5" />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send the link
        </Button>
      </form>
    </Shell>
  );
}
