import { Navigate } from "react-router-dom";
import { useAuth } from "../../app/AuthProvider";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/creator/auth" replace />;
  }

  return children;
}
