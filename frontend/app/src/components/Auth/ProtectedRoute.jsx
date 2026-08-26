// src/components/Auth/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const currentRole = String(user.role || "").toUpperCase();

  if (currentRole === "PENDING" || currentRole === "GUEST") {
    return <Navigate to="/auth/google/callback" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
    if (currentRole === "STAFF" || currentRole === "ADMIN") {
      return <Navigate to="/dashboard/organizer" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}