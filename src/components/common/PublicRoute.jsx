import { Navigate } from "react-router-dom";
import { useAuth, ROLES } from "../../context/AuthContext";

export default function PublicRoute({ children }) {
  const { user, userRole, loading } = useAuth();

  // Mostrar un loader mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Si el usuario está autenticado como admin, redirigir al dashboard
  if (user && userRole === ROLES.ADMIN) {
    return <Navigate to="/dashboard-admin" replace />;
  }

  // Si no está autenticado o es otro rol, mostrar la página pública
  return children;
}

