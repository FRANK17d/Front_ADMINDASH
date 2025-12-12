import { Navigate } from "react-router-dom";
import { useAuth, ROLES } from "../../context/AuthContext";

export default function PublicRoute({ children }) {
  const { user, userRole, loading, isLoggingIn } = useAuth();

  // Mostrar un loader mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // No redirigir si el login está en proceso (evita redirección prematura)
  if (isLoggingIn) {
    return children;
  }

  // Solo redirigir si hay usuario autenticado y NO está en proceso de login
  if (user && userRole && !isLoggingIn) {
    const dashboardPath =
      userRole === ROLES.ADMIN
        ? '/admin/pasajeros'
        : userRole === ROLES.RECEPTIONIST
        ? '/recepcionista/pasajeros'
        : userRole === ROLES.HOUSEKEEPING
        ? '/hoteler/pasajeros'
        : '/admin/pasajeros';
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
}

