import { Navigate } from "react-router-dom";

import { Spinner } from "@/utils/Spinner";
import { useAuth } from "@/contexts/auth-context";

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { token, ready } = useAuth();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (token) {
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
}
