import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isReady, session, profile, defaultRouteForRole } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] text-sm text-slate-600">
        Loading Gourmet Haven...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(profile?.role)) {
    return <Navigate to={defaultRouteForRole()} replace />;
  }

  return children;
}
