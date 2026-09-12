import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api, ApiError } from "@/api";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/session";
import { withNext } from "@/lib/handoff";

/**
 * The account, and nothing else.
 *
 * No business name, no product, no plan. Those come after, in their own steps,
 * because an account is the only thing that has to exist before an email can be
 * verified — and asking for six fields before the first one is checked is how a
 * signup form loses people.
 */
export default function SignUp() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, refresh } = useSession();

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const result = await api.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setToken(result.access_token);

      // Registration signs them in as well, so the session cookie exists from here
      // on and the rest of onboarding needs no further password.
      await api.signIn(form.email.trim(), form.password).catch(() => undefined);
      await refresh();

      navigate(withNext("/verify", params.get("next"), params.get("product")));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't create your account.");
      setBusy(false);
    }
  };

  return (
    <Shell
      title="Create your account"
      standfirst="It works across every Reservon product — you pick which one you're here for next."
      footer={
        <>
          Already have one?{" "}
          {/* Carries the destination across, so someone who realises they already
              have an account doesn't lose the page they were sent from. */}
          <Link to={withNext("/signin", params.get("next"))} className="text-primary underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" value={form.firstName} onChange={set("firstName")} required autoComplete="given-name" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" value={form.lastName} onChange={set("lastName")} required autoComplete="family-name" className="mt-1.5" />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" value={form.email} onChange={set("email")} required autoComplete="email" className="mt-1.5" />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={set("password")}
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1.5"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">At least eight characters.</p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>
    </Shell>
  );
}
