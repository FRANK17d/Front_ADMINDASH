import { Navigate } from "react-router-dom";
import { useAuth, ROLES } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, userRole, loading } = useAuth();

  // Mostrar un loader mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Si no hay usuario, redirigir a login
  if (!user) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  // Solo permitir acceso a ADMIN o SUPERADMIN
  if (userRole === ROLES.ADMIN || userRole === ROLES.SUPERADMIN) {
    return children;
  }

  // Cualquier otro rol (incluyendo empleados) no tiene acceso
  return <Navigate to="/iniciar-sesion" replace />;
}

