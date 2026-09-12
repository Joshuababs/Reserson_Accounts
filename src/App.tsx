import { Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import BusinessDetails from "@/pages/BusinessDetails";
import Forgot from "@/pages/Forgot";
import Products from "@/pages/Products";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import Verify from "@/pages/Verify";
import { useSession } from "@/session";

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!me) return <Navigate to="/signin" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot" element={<Forgot />} />
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
          <RequireSession>
            <BusinessDetails />
          </RequireSession>
        }
      />
      <Route
        path="/products"
        element={
          <RequireSession>
            <Products />
          </RequireSession>
        }
      />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}
