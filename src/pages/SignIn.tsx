import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api, ApiError } from "@/api";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/session";
import { continueTo, withNext } from "@/lib/handoff";

export default function SignIn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, refresh } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const result = await api.signIn(email.trim(), password);
      setToken(result.access_token);
      const me = await refresh();

      // Where they were going, or where their account says they belong. A customer
      // who clicked "sign in" on the operator console ends up back there, not on a
      // product picker they didn't ask for.
      continueTo({ next: params.get("next"), me: me ?? result.me }, navigate);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't sign you in. Please try again.");
      setBusy(false);
    }
  };

  return (
    <Shell
      title="Sign in"
      standfirst="One account for every Reservon product."
      footer={
        <>
          New here?{" "}
          <Link to={withNext("/signup", params.get("next"))} className="text-primary underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1.5"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot" className="text-xs text-muted-foreground underline underline-offset-4">
              Forgotten it?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
          Sign in
        </Button>
      </form>
    </Shell>
  );
}
