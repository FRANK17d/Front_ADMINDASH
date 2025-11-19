import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RoleRoute({ children, allowedRoles }) {
  const { userRole, loading } = useAuth();

  // Mostrar un loader mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Si el rol del usuario no está en la lista de roles permitidos, redirigir al dashboard correspondiente
  if (!allowedRoles.includes(userRole)) {
    const dashboardPath =
      userRole === 'receptionist'
        ? '/recepcionista/dashboard'
        : userRole === 'housekeeping'
        ? '/hoteler/dashboard'
        : '/admin/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
}
