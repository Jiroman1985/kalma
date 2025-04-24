import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (userData && !userData.hasFullAccess && 
      location.pathname !== "/dashboard" && 
      !location.pathname.includes("/settings")) {
    return <Navigate to="/settings" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
