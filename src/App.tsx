import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { Spinner } from "@/components/Spinner";
import BusinessDetails from "@/pages/BusinessDetails";
import Forgot from "@/pages/Forgot";
import Products from "@/pages/Products";
import Reset from "@/pages/Reset";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import Verify from "@/pages/Verify";
import { useSession } from "@/session";
import { withNext } from "@/lib/handoff";

/**
 * Everything past sign-in needs a session.
 *
 * The check is against the cookie, resolved once on load, so arriving here already
 * signed in from another product goes straight through rather than round the loop.
 */
function RequireSession({ children }: { children: React.ReactNode }) {
  const { me, loading } = useSession();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Spinner size={40} />
      </div>
    );
  }

  if (!me) return <Navigate to="/signin" replace />;
  return <>{children}</>;
}

/**
 * The steps after verification, for an account that has verified.
 *
 * The API has always refused to register a business for an unverified account,
 * so reaching these screens first only produced a 403 the person couldn't act
 * on — and made it look as though the code step had been skipped. Now the flow
 * goes back to the code, which is the one thing that unblocks them.
 */
function RequireVerified({ children }: { children: React.ReactNode }) {
  const { me, loading } = useSession();
  const [params] = useSearchParams();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Spinner size={40} />
      </div>
    );
  }

  if (!me) return <Navigate to="/signin" replace />;
  if (!me.user.isEmailVerified) {
    return <Navigate to={withNext("/verify", params.get("next"), params.get("product"))} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/reset" element={<Reset />} />
      <Route
        path="/verify"
        element={
          <RequireSession>
            <Verify />
          </RequireSession>
        }
      />
      <Route
        path="/business"
        element={
          <RequireVerified>
            <BusinessDetails />
          </RequireVerified>
        }
      />
      <Route
        path="/products"
        element={
          <RequireVerified>
            <Products />
          </RequireVerified>
        }
      />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}
