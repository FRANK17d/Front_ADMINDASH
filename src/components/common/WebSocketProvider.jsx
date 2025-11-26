import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';

const WS_URL = import.meta?.env?.VITE_WS_URL || "ws://localhost:8000/ws/presence/";

/**
 * Componente que mantiene la conexión WebSocket activa globalmente
 * Esto permite que las notificaciones funcionen en toda la aplicación
 */
export default function WebSocketProvider({ children }) {
  const { user, loading } = useAuth();
  const { isConnected, connectionStatus } = useWebSocket(WS_URL);

  useEffect(() => {
    if (!loading) {
      if (user) {
        console.log('WebSocket Provider: Usuario autenticado, conexión:', connectionStatus, 'Conectado:', isConnected);
      } else {
        console.log('WebSocket Provider: No hay usuario autenticado');
      }
    }
  }, [user, loading, isConnected, connectionStatus]);

  // Este componente solo mantiene la conexión activa, no renderiza nada
  return <>{children}</>;
}

