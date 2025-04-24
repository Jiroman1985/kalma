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

  // Verificar si el usuario no tiene acceso completo y está intentando acceder a cualquier ruta
  // que no sea específicamente la página de configuración
  const isSettingsPath = location.pathname === "/dashboard/settings" || location.pathname === "/settings";
  
  // Si el usuario tiene freeTier pero no está vinculado, redirigir a settings
  if (userData && userData.freeTier && !userData.vinculado && !isSettingsPath) {
    console.log("Usuario con freeTier sin vincular. Redirigiendo a settings desde:", location.pathname);
    return <Navigate to="/dashboard/settings" />;
  }
  
  // Si el usuario no tiene acceso completo, redirigir a settings
  if (userData && !userData.hasFullAccess && !isSettingsPath) {
    console.log("Usuario sin acceso completo. Redirigiendo a settings desde:", location.pathname);
    return <Navigate to="/dashboard/settings" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
