import { useAuth, ROLES } from "../../context/AuthContext";
import { useWebSocketContext } from "../common/WebSocketProvider";

export default function UserInfoCard() {
  const { user, userRole } = useAuth();
  const { isConnected, connectionStatus, isOnline: isBrowserOnline } = useWebSocketContext();
  
  // Determinar si está online basado en WebSocket y conexión del navegador
  const isOnline = isConnected && connectionStatus === 'connected' && isBrowserOnline;
  
  const getRoleName = (role) => {
    switch(role) {
      case ROLES.ADMIN:
        return 'Administrador';
      case ROLES.RECEPTIONIST:
        return 'Recepcionista';
      default:
        return 'Usuario';
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Información Personal
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Nombre Completo
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.displayName || 'No especificado'}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Correo Electrónico
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.email || 'No especificado'}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Rol
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {getRoleName(userRole)}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Estado
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {connectionStatus === 'connecting' ? (
                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 dark:bg-yellow-400 animate-pulse"></span>
                      Conectando...
                    </span>
                  ) : isOnline ? (
                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400 animate-pulse"></span>
                      En línea
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400"></span>
                      Desconectado
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
